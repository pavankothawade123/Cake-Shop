#!/bin/bash

# Cake Shop - Dependency Installation Script
# Run this script to install all required dependencies

set -e  # Exit on error

echo "🚀 Starting Cake Shop dependency installation..."
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH (for Apple Silicon Macs)
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew already installed"
fi

echo ""

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    brew install node
else
    echo "✅ Node.js already installed ($(node --version))"
fi

echo ""

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    brew install postgresql@15

    # Add PostgreSQL to PATH
    echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zprofile
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
else
    echo "✅ PostgreSQL already installed"
fi

echo ""

# Start PostgreSQL
echo "🔄 Starting PostgreSQL service..."
brew services start postgresql@15

echo ""

# Wait for PostgreSQL to start
echo "⏳ Waiting for PostgreSQL to start..."
sleep 3

# Create database
echo "🗄️  Creating cakeshop database..."
if psql postgres -lqt | cut -d \| -f 1 | grep -qw cakeshop; then
    echo "✅ Database 'cakeshop' already exists"
else
    createdb cakeshop
    echo "✅ Database 'cakeshop' created successfully"
fi

echo ""
echo "✨ All dependencies installed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Close and reopen your terminal (or run: source ~/.zprofile)"
echo "   2. Run the following commands in the Cake-Shop directory:"
echo "      npm install"
echo "      npx prisma generate"
echo "      npx prisma db push"
echo "      npm run dev"
echo ""
