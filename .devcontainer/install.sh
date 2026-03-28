#!/bin/bash
set -e

echo "==> Updating apt..."
apt-get update -q

echo "==> Installing Java 21..."
apt-get install -y openjdk-21-jdk

echo "==> Installing Node 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "==> Installing Go 1.22..."
curl -OL https://go.dev/dl/go1.22.5.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz
rm go1.22.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
echo 'export PATH=$PATH:/usr/local/go/bin' >> /root/.bashrc

echo "==> Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
echo 'export PATH=$PATH:/root/.cargo/bin' >> /root/.bashrc

echo "==> All done!"