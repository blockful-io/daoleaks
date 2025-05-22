FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    vim \
    htop \
    tree \
    jq \
    unzip \
    build-essential \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Rust and Cargo as root, then make available to vscode user
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Node.js (required for pnpm)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install pnpm globally
RUN npm install -g pnpm

# Configure pnpm to use a global store location
RUN pnpm config set store-dir /home/vscode/.pnpm-store
RUN pnpm config set cache-dir /home/vscode/.pnpm-cache


# Install Foundry (Solidity toolkit)
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"
RUN foundryup

# Switch to vscode user for user-specific installations
USER vscode

# Set up Rust for vscode user
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="/home/vscode/.cargo/bin:${PATH}"

# Install Foundry for vscode user
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/home/vscode/.foundry/bin:${PATH}"
RUN /home/vscode/.foundry/bin/foundryup

# Install Noir (noirup) - Fixed approach
RUN curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
ENV PATH="/home/vscode/.nargo/bin:${PATH}"
# Source the bashrc to get the updated PATH, then run noirup
RUN /bin/bash -c "source /home/vscode/.bashrc && noirup"

# Install Barretenberg (bbup)
RUN curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
ENV PATH="/home/vscode/.bb:${PATH}"
RUN /bin/bash -c "source /home/vscode/.bashrc && bbup"

# Set working directory
WORKDIR /workspaces