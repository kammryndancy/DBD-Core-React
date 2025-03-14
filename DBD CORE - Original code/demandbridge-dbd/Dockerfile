FROM registry.access.redhat.com/ubi7/ubi:latest

RUN yum update -y && yum install -y \
    wget \
    tar \
    git \
    openssh-clients \
    glibc.i686 \
    libX11 \
    libXt \
    libXext \
    libXmu \
    glib2 \
    libSM \
    libICE \
    ncurses \
    which \
    python3 \
    python3-pip \
    && yum clean all

RUN mkdir /pxplus && cd /pxplus
WORKDIR /pxplus

RUN wget -O pxplus.taz https://pvxplus.com/downloads/pxp2110/pxp2110-0000-DEB8-64.taz \
    && tar -xvzf pxplus.taz \
    && rm pxplus.taz

RUN echo "DAP" | ./pxpreg -d

ENV PATH="/pxplus:$PATH"

RUN if [ -d "repo/.git" ]; then \
    cd repo && git reset --hard HEAD && git pull origin main; \
else \
    rm -rf repo &&git clone https://davidperez4:ATBBZNZtN2uR9TfLjXxmRkN2nuSFE5753AD8@bitbucket.org/demandbridge/dbd.git repo; \
fi

RUN mkdir -p /pxplus/output

RUN cp /pxplus/pxplus /pxplus/repo

RUN cd repo
WORKDIR /pxplus/repo

RUN python FileProcessor_V1.py

RUN cd ..
WORKDIR /pxplus

RUN mkdir -p /root/.ssh && \
    cp /pxplus/repo/id_rsa /root/.ssh/id_rsa && \
    chmod 600 /root/.ssh/id_rsa

RUN echo "Host *\n\tStrictHostKeyChecking no" > /root/.ssh/config

RUN ssh-keyscan -H 10.20.0.4 >> /root/.ssh/known_hosts

RUN eval $(ssh-agent -s) && \
    ssh-add /root/.ssh/id_rsa && \
    ssh -o StrictHostKeyChecking=no dap@10.20.0.4 "rm -r /usr/lib/pvx/testdocker" && \
    ssh -o StrictHostKeyChecking=no dap@10.20.0.4 "mkdir -p /usr/lib/pvx/testdocker" && \
    scp -o StrictHostKeyChecking=no -r /pxplus/output/* dap@10.20.0.4:/usr/lib/pvx/testdocker/