#!/bin/bash
# Start both backend and frontend in parallel with proper host binding
npm-run-all --parallel dev:backend "exec -- vite dev --host 0.0.0.0 --mode replit"
