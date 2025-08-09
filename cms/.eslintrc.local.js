module.exports = {
  extends: ['./.eslintrc.json'],
  rules: {
    // Prevent inline styles - use CSS classes or utility functions instead
    'react/forbid-dom-props': [
      'error',
      {
        forbid: [
          {
            propName: 'style',
            message: 'Avoid inline styles. Use CSS classes or the dynamic-styles utility functions instead. For dynamic values, use createDynamicStyles() or getDynamicPaddingLeft() from utils/dynamic-styles.ts'
          }
        ]
      }
    ],
    
    // Additional rules for better code quality
    'react/no-unknown-property': 'error',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
  },
  
  // Allow style prop only in specific cases where it's necessary
  overrides: [
    {
      files: ['**/utils/dynamic-styles.ts', '**/components/**/Dynamic*.tsx'],
      rules: {
        'react/forbid-dom-props': 'off'
      }
    }
  ]
};