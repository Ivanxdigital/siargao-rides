#!/bin/bash

# Update all imports to reference lowercase component names
cd "$(dirname "$0")"

COMPONENTS=(
  "Alert"
  "Avatar"
  "Badge"
  "Button"
  "Calendar"
  "Card"
  "Checkbox"
  "DatePicker"
  "Dialog"
  "Input"
  "Label"
  "Popover"
  "RadioGroup"
  "Select"
  "Separator"
  "Skeleton"
  "Slider"
  "Switch"
  "Tabs"
  "Textarea"
  "ToastProvider"
  "Tooltip"
)

# Function to convert PascalCase to lowercase
to_lowercase() {
  echo "$1" | tr '[:upper:]' '[:lower:]'
}

# Find all TypeScript and TSX files
find src -type f -name "*.tsx" -o -name "*.ts" | while read -r file; do
  # Skip node_modules and other irrelevant directories
  if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".next"* ]]; then
    continue
  fi
  
  echo "Processing $file"
  
  # Process each component
  for component in "${COMPONENTS[@]}"; do
    lowercase=$(to_lowercase "$component")
    
    # Replace imports (with appropriate spacing and quotes)
    sed -i '' -E "s|(@/components/ui/${component})([\"'])|@/components/ui/${lowercase}\2|g" "$file"
    sed -i '' -E "s|(\\./ui/${component})([\"'])|./ui/${lowercase}\2|g" "$file"
  done
done

echo "Done updating import statements." 