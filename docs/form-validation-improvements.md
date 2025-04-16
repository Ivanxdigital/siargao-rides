# Form Validation Improvements for Registration Form

This document outlines the plan to enhance form validation for the shop registration form located at `src/app/register/page.tsx`.

## Current State

The registration form currently has basic validation:

- HTML5 built-in validation with `required` attributes
- Input type validation (`type="email"`, `type="tel"`)
- File type restrictions via `accept` attributes
- Server-side validation for authentication and reCAPTCHA
- General error message display

## Improvement Goals

1. Implement comprehensive client-side validation
2. Provide real-time feedback to users
3. Enhance user experience with clear validation messages
4. Maintain mobile-first design principles
5. Keep the existing UI aesthetic

## Implementation Plan

### 1. Add React Hook Form Integration

[React Hook Form](https://react-hook-form.com/) provides efficient form validation with minimal re-renders and a simple API.

```jsx
import { useForm } from "react-hook-form";
```

### 2. Add Zod Schema Validation

[Zod](https://github.com/colinhacks/zod) is a TypeScript-first schema validation library that works well with React Hook Form.

```jsx
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
```

### 3. Define Validation Schema

Create a schema that defines validation rules for each field:

```jsx
const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^(\+?63|0)?[0-9]{10}$/, "Please enter a valid Philippine phone number"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  referral: z.string().optional(),
  // File validation will be handled separately
});
```

### 4. Implement Field-Level Validation

Add validation feedback for each field:

```jsx
<div>
  <label htmlFor="fullName" className="block text-sm font-medium mb-1">
    {t('full_name')}
  </label>
  <input
    {...register("fullName")}
    className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
      errors.fullName ? "border-red-500" : "border-input"
    }`}
  />
  {errors.fullName && (
    <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
  )}
</div>
```

### 5. Add Real-Time Validation

Configure React Hook Form to validate on change or blur:

```jsx
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting, isDirty, isValid },
  watch,
  reset
} = useForm({
  resolver: zodResolver(formSchema),
  mode: "onChange", // Validate on change
});
```

### 6. Enhance File Validation

Implement custom validation for file uploads:

```jsx
const validateFile = (file) => {
  if (!file) return "This file is required";
  
  const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
  if (!validTypes.includes(file.type)) {
    return "File must be an image (JPEG, PNG, GIF) or PDF";
  }
  
  const fiveMB = 5 * 1024 * 1024;
  if (file.size > fiveMB) {
    return "File must be smaller than 5MB";
  }
  
  return true;
};
```

### 7. Add Form Submission Validation

Enhance the form submission process:

```jsx
const onSubmit = async (data) => {
  try {
    setError(null);
    
    // Validate files
    if (!governmentIdFile) {
      setError("Government ID is required");
      return;
    }
    
    // Continue with existing submission logic...
  } catch (err) {
    setError(err.message || "An error occurred during submission");
  }
};
```

### 8. Improve Error Messaging

Create a more detailed error display system:

```jsx
{error && (
  <motion.div
    className="bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-md p-4 mb-6"
    variants={slideUp}
  >
    <div className="flex items-start gap-3">
      <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    </div>
  </motion.div>
)}
```

### 9. Add Form Progress Indicator

Show users their progress through the form:

```jsx
<div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 dark:bg-gray-700">
  <div 
    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
    style={{ width: `${formProgress}%` }}
  ></div>
</div>
```

### 10. Implement Accessibility Improvements

Ensure the form is accessible:

```jsx
<input
  {...register("fullName")}
  aria-invalid={errors.fullName ? "true" : "false"}
  aria-describedby={errors.fullName ? "fullName-error" : ""}
/>
{errors.fullName && (
  <p id="fullName-error" className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
)}
```

## Implementation Checklist

- [ ] **Setup and Integration**
  - [ ] Install React Hook Form and Zod
  - [ ] Create validation schema
  - [ ] Integrate with existing form

- [ ] **Field Validation**
  - [ ] Full Name validation
  - [ ] Shop Name validation
  - [ ] Email validation
  - [ ] Phone number validation with Philippine format
  - [ ] Address validation
  - [ ] Referral field validation (optional)

- [ ] **File Upload Validation**
  - [ ] Government ID validation (required, file type, size)
  - [ ] Business Permit validation (optional, file type, size)
  - [ ] Visual feedback for file uploads

- [ ] **UI/UX Enhancements**
  - [ ] Add field-level error messages
  - [ ] Implement real-time validation feedback
  - [ ] Add visual indicators for valid/invalid fields
  - [ ] Ensure mobile-friendly error messages

- [ ] **Accessibility**
  - [ ] Add proper ARIA attributes
  - [ ] Ensure keyboard navigation works
  - [ ] Test with screen readers

- [ ] **Testing**
  - [ ] Test all validation rules
  - [ ] Test form submission with valid/invalid data
  - [ ] Test on mobile devices
  - [ ] Test with different browsers

- [ ] **Documentation**
  - [ ] Update code comments
  - [ ] Document validation rules
  - [ ] Create examples for future forms

## Technical Considerations

1. **Performance**: React Hook Form is chosen for its performance benefits with minimal re-renders.
2. **Bundle Size**: Consider the added bundle size from validation libraries.
3. **Internationalization**: Ensure validation messages work with the existing translation system.
4. **Backward Compatibility**: Maintain compatibility with the existing form submission logic.

## Future Enhancements

- Password strength meter for any future password fields
- Multi-step form validation
- Save form progress locally
- Advanced file preview capabilities
