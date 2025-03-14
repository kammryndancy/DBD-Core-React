import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbClient } from '../db/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class AuthController {
  async login(req, res, next) {
    const { username, password } = req.body;
    const client = await dbClient.getClient();

    try {
      await client.query('BEGIN');

      // Get user with division information
      const { rows } = await client.query(`
        SELECT u.*, d.division_code 
        FROM auth.users u
        LEFT JOIN accounts_payable.divisions d ON u.division_id = d.id
        WHERE u.username = $1 AND u.status != 'inactive'
      `, [username]);

      const user = rows[0];

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is locked
      if (user.status === 'locked') {
        const lockoutEnd = new Date(user.last_login_attempt.getTime() + config.security.lockoutDuration);
        if (new Date() < lockoutEnd) {
          return res.status(423).json({
            message: 'Account is locked. Try again later.',
            lockoutEnd
          });
        }
        // Reset lock if lockout period has passed
        await client.query(`
          UPDATE auth.users 
          SET status = 'active', failed_login_attempts = 0 
          WHERE id = $1
        `, [user.id]);
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        // Increment failed attempts
        const failedAttempts = user.failed_login_attempts + 1;
        const shouldLock = failedAttempts >= config.security.maxLoginAttempts;

        await client.query(`
          UPDATE auth.users 
          SET failed_login_attempts = $1,
              last_login_attempt = CURRENT_TIMESTAMP,
              status = $2
          WHERE id = $3
        `, [failedAttempts, shouldLock ? 'locked' : user.status, user.id]);

        await client.query('COMMIT');

        if (shouldLock) {
          return res.status(423).json({
            message: 'Account has been locked due to too many failed attempts'
          });
        }

        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Reset failed attempts on successful login
      await client.query(`
        UPDATE auth.users 
        SET failed_login_attempts = 0,
            last_login_attempt = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [user.id]);

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken();

      // Store refresh token
      await client.query(`
        INSERT INTO auth.refresh_tokens (
          user_id, token, expires_at, created_by
        ) VALUES ($1, $2, $3, $4)
      `, [
        user.id,
        refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        username
      ]);

      await client.query('COMMIT');

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          divisionCode: user.division_code
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  async register(req, res, next) {
    const { username, email, password, firstName, lastName, divisionId, role } = req.body;
    const client = await dbClient.getClient();

    try {
      await client.query('BEGIN');

      // Check if username or email already exists
      const { rows } = await client.query(`
        SELECT username, email FROM auth.users 
        WHERE username = $1 OR email = $2
      `, [username, email]);

      if (rows.length > 0) {
        return res.status(409).json({
          message: 'Username or email already exists'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, config.security.saltRounds);

      // Create user
      const result = await client.query(`
        INSERT INTO auth.users (
          username, email, password_hash, first_name, last_name,
          division_id, role, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
        RETURNING id, username, email, role
      `, [
        username, email, passwordHash, firstName, lastName,
        divisionId, role, 'system'
      ]);

      await client.query('COMMIT');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  async refreshToken(req, res, next) {
    const { refreshToken } = req.body;
    const client = await dbClient.getClient();

    try {
      // Verify refresh token exists and is valid
      const { rows } = await client.query(`
        SELECT rt.*, u.username, u.role, u.division_id, d.division_code
        FROM auth.refresh_tokens rt
        JOIN auth.users u ON rt.user_id = u.id
        LEFT JOIN accounts_payable.divisions d ON u.division_id = d.id
        WHERE rt.token = $1 AND rt.expires_at > CURRENT_TIMESTAMP
      `, [refreshToken]);

      if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const tokenData = rows[0];

      // Generate new access token
      const accessToken = this.generateAccessToken({
        id: tokenData.user_id,
        username: tokenData.username,
        role: tokenData.role,
        divisionCode: tokenData.division_code
      });

      res.json({ accessToken });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  async logout(req, res, next) {
    const { refreshToken } = req.body;
    const client = await dbClient.getClient();

    try {
      await client.query('DELETE FROM auth.refresh_tokens WHERE token = $1', [refreshToken]);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  }

  validateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  checkRole(roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      next();
    };
  }

  async checkDivisionAccess(req, res, next) {
    const { divisionId } = req.params;
    
    // Allow admin to access all divisions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user belongs to the requested division
    if (req.user.divisionId !== divisionId) {
      return res.status(403).json({ message: 'Access denied to this division' });
    }

    next();
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        divisionId: user.division_id,
        divisionCode: user.division_code
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  generateRefreshToken() {
    return uuidv4();
  }
}

export const authController = new AuthController();
