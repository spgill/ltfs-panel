FROM debian:buster

# Install dependencies
RUN apt update && \
	apt -y install --no-install-recommends ca-certificates wget unzip && \
    apt -y install --no-install-recommends build-essential automake autoconf libtool pkg-config icu* libicu* icu-devtools libicu-dev libxml2-dev uuid-dev fuse libfuse-dev libsnmp-dev && \
	rm -rf /var/lib/apt/lists/* && \
    apt clean

# Download the source package and build it
COPY scripts/icu-config /usr/bin/icu-config
RUN chmod +x /usr/bin/icu-config && \
    mkdir ~/ltfs-src && \
    cd ~/ltfs-src && \
    wget http://downloads.quantum.com/open_source/LTFS/2.4.0.2/5-00732-10.zip && \
    unzip 5-00732-10.zip && \
    tar -xvf qtmltfs-2.4.0.2-1.tar.gz && \
    cd qtmltfs2.4 && \
    ./autogen.sh && \
    ./configure && \
    make && \
    make install && \
    echo /usr/local/lib>>/etc/ld.so.conf && \
    /sbin/ldconfig && \
    cd / && \
    rm -rf ~/ltfs-src

# Install management tools and python dependencies
RUN apt update && \
    apt -y install --no-install-recommends lsscsi mt-st && \
	apt -y install --no-install-recommends python3-pip python3-setuptools python3-wheel python3-dev && \
	rm -rf /var/lib/apt/lists/* && \
    apt clean && \
    pip3 install flask gevent xattr

# Add web UI source
ADD ./build /root/build
ADD ./server /root/server

# Install web UI dependencies
RUN pip3 install -r /root/server/requirements.txt

# Expose the port
EXPOSE 5000/tcp

# Entrypoint causes docker to stay idle
ENTRYPOINT ["python3", "/root/server/main.py"]
