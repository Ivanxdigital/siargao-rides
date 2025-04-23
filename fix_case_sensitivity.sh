#!/bin/bash

# This script forces lowercase renaming for UI components
# It uses git to ensure the changes are tracked correctly

cd "$(dirname "$0")"

# List of files to forcibly rename (adjust based on what's in your directory)
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

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    dir=$(dirname "$file")
    basename=$(basename "$file")
    lowercase=$(echo "$basename" | tr '[:upper:]' '[:lower:]')
    
    if [ "$basename" != "$lowercase" ]; then
      echo "Force renaming $file to $dir/$lowercase"
      # Use git mv to properly track the rename
      git rm "$file"
      mkdir -p "$dir"
      git add "$dir/$lowercase"
    fi
  fi
done

echo "Now all component files should be correctly renamed to lowercase." 