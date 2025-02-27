#!/bin/bash

PACKAGE="models"
OPENNEBULA_XSD_DIR="/usr/share/one/schemas/xsd"
SCHEDULER_DRIVER_ACTION="scheduler_driver_action.xsd"
SCHEDULER_DRIVER_OUTPUT="plan.xsd"

echo "Generating Python models from XSData..."
xsdata generate -p lib.${PACKAGE} ${OPENNEBULA_XSD_DIR}/${SCHEDULER_DRIVER_OUTPUT} 
xsdata generate -p lib.${PACKAGE} ${OPENNEBULA_XSD_DIR}/${SCHEDULER_DRIVER_ACTION}

echo "Moving generated models..."
mkdir -p ./${PACKAGE}
mv ./lib/${PACKAGE}/* ./${PACKAGE}
rm -rf ./lib

echo "Updating generated models..."
sed -i "1i from lib.${PACKAGE}.plan import Plan" "./${PACKAGE}/__init__.py"
sed -i '/^__all__ = \[/ a\    "Plan",' "./${PACKAGE}/__init__.py"
for file in ./${PACKAGE}/*.py; do
  sed -i '/^__NAMESPACE__ = "http:\/\/opennebula.org\/XMLSchema"$/,+1d' "$file"
  sed -i '/namespace/d' "$file"
done

echo "Cleaning up..."
rm -rf ./.ruff_cache ./${PACKAGE}/__pycache__ ./__pycache__