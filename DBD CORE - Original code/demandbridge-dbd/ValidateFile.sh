#!/bin/bash

TERM=ansi
export TERM
umask 0

ARGUMENT=$1  

exec /usr/lib/pvx/pxplus ValidateFile -arg "${ARGUMENT}" 
