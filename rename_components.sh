#!/bin/bash

# Convert UI component files from PascalCase to lowercase
cd "$(dirname "$0")"

# List of files to rename
FILES=(
  "src/components/ui/Alert.tsx"
  "src/components/ui/Avatar.tsx"
  "src/components/ui/Badge.tsx"
  "src/components/ui/Button.tsx"
  "src/components/ui/Calendar.tsx"
  "src/components/ui/Card.tsx"
  "src/components/ui/Checkbox.tsx"
  "src/components/ui/DatePicker.tsx"
  "src/components/ui/Dialog.tsx"
  "src/components/ui/Input.tsx"
  "src/components/ui/Label.tsx"
  "src/components/ui/Popover.tsx"
  "src/components/ui/RadioGroup.tsx"
  "src/components/ui/Select.tsx"
  "src/components/ui/Separator.tsx"
  "src/components/ui/Skeleton.tsx"
  "src/components/ui/Slider.tsx"
  "src/components/ui/Switch.tsx"
  "src/components/ui/Tabs.tsx"
  "src/components/ui/Textarea.tsx"
  "src/components/ui/ToastProvider.tsx"
  "src/components/ui/Tooltip.tsx"
)

# For each file, create a temporary file with lowercase name then replace the original
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    dir=$(dirname "$file")
    basename=$(basename "$file")
    lowercase=$(echo "$basename" | tr '[:upper:]' '[:lower:]')
    
    if [ "$basename" != "$lowercase" ]; then
      echo "Renaming $file to $dir/$lowercase"
      # Use a temporary name to avoid case-insensitivity issues on macOS
      tempname="${dir}/_temp_${lowercase}"
      cp "$file" "$tempname"
      mv "$tempname" "${dir}/${lowercase}"
    fi
  else
    echo "Warning: $file does not exist"
  fi
done

echo "Done renaming files. Next step: Update all import statements using grep & sed." 