# GhostBudget

GhostBudget is a Node.js application that synchronizes account balances between Actual Budget and Ghostfolio. It automatically fetches your account balances from Actual Budget and updates the corresponding accounts in Ghostfolio.

## Features

- Automatic authentication with both Actual Budget and Ghostfolio
- Configurable account mapping between the two systems
- Automatic balance conversion from Actual Budget's format to Ghostfolio's format
- Detailed logging for monitoring and troubleshooting
- Error handling with helpful messages

## Prerequisites

- Node.js (v14 or higher recommended)
- An Actual Budget server instance
- A Ghostfolio instance
- Access tokens/credentials for both services

## Installation

1. Clone the repository:
```bash
git clone https://github.com/johnkrzywanek/ghostbudget.git
cd ghostbudget
```

2. Install dependencies:
```bash
npm install
```

3. Create configuration files:
```bash
cp .env.example .env
cp config.json.example config.json
```

4. Edit the `.env` file with your credentials and settings
5. Edit the `config.json` file with your account mappings

## Configuration

### Environment Variables (.env)

- `ACTUAL_BUDGET_URL`: URL of your Actual Budget server
- `ACTUAL_BUDGET_PASS`: Your Actual Budget server password
- `ACTUAL_BUDGET_SYNC_ID`: Your budget's sync ID
- `ACTUAL_BUDGET_DATA_DIR`: Directory for Actual Budget data
- `GHOSTFOLIO_URL`: URL of your Ghostfolio instance
- `GHOSTFOLIO_TOKEN`: Your Ghostfolio access token

### Account Mapping (config.json)

The `config.json` file maps accounts between Actual Budget and Ghostfolio. Example structure:

```json
{
  "accounts": [
    {
      "ghostfolioName": "Exact name of account in Ghostfolio",
      "actualBudgetName": "Exact name of account in Actual Budget"
    }
  ]
}
```

**Note**: Account names must match exactly with the names in both systems.

## Usage

Run the synchronization:

```bash
node src/index.js
```

The script will:
1. Fetch account balances from Actual Budget
2. Authenticate with Ghostfolio
3. Get the current account list from Ghostfolio
4. Map accounts between the two systems
5. Update balances in Ghostfolio

### Balance Conversion

The application automatically handles balance conversion between the two systems:
- Actual Budget stores balances as integers (e.g., 100012 for $1,000.12)
- GhostBudget converts these to decimal format before sending to Ghostfolio (e.g., 1000.12)

## Error Handling

The application includes comprehensive error handling:
- Validates required environment variables
- Verifies account mappings exist in both systems
- Provides detailed error messages for troubleshooting
- Logs all operations for debugging

## Development


### Adding New Features

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**
   - Verify your Actual Budget and Ghostfolio servers are running
   - Check URLs in `.env` file
   - Verify network connectivity

2. **Authentication Errors**
   - Verify your access tokens/credentials
   - Check if tokens have expired
   - Ensure proper permissions are set

3. **Account Mapping Issues**
   - Verify account names match exactly
   - Check for typos in config.json
   - Ensure accounts exist in both systems

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or need support, please create an issue in the GitHub repository.
