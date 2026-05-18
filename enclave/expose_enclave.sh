# Copyright (c), Mysten Labs, Inc.
# SPDX-License-Identifier: Apache-2.0
#!/bin/bash

# Gets the enclave id and CID
# expects there to be only one enclave running
ENCLAVE_ID=$(nitro-cli describe-enclaves | jq -r ".[0].EnclaveID")
ENCLAVE_CID=$(nitro-cli describe-enclaves | jq -r ".[0].EnclaveCID")

sleep 5
# Secrets-block
# Fetch walform secrets from AWS Secrets Manager (flat JSON with all env vars)
ROLE_NAME="walform-enclave-role"
SECRET_ARN="arn:aws:secretsmanager:us-east-1:658469473405:secret:walform-secrets-KBWVSH"
echo "Fetching secrets from AWS Secrets Manager..."
aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --region us-east-1 --query 'SecretString' --output text > secrets.json
echo "Secrets loaded."

cat secrets.json | socat - VSOCK-CONNECT:$ENCLAVE_CID:7777
socat TCP4-LISTEN:3000,reuseaddr,fork VSOCK-CONNECT:$ENCLAVE_CID:3000 &

# Additional port configurations will be added here by configure_enclave.sh if needed
