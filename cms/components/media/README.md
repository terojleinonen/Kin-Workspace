# Advanced Media Management Components

This directory contains advanced media management components that provide comprehensive file organization, bulk operations, and metadata editing capabilities.

## Components Overview

### MediaFolderTree
A hierarchical folder tree component for organizing media files.

**Features:**
- Expandable/collapsible folder structure
- Folder selection and navigation
- Inline folder renaming (double-click)
- Folder creation, deletion, and management
- File count display per folder
- "All Files" root view

**Props:**
- `folders`: Array of folder objects with hierarchy
- `selectedFolderId`: Currently selected folder ID
- `onFolderSelect`: Callback for folder selection
- `onFolderCreate`: Optional callback for creating new folders
- `onFolderRename`: Optional callback for renaming folders
- `onFolderDelete`: Optional callback for deleting folders

### MediaBulkActions
A floating action bar for performing bulk operations on selected files.

**Features:**
- Move files between folders
- Add tags to multiple files
- Bulk download functionality
- Bulk delete with confirmation
- Clear selection option
- Modal dialogs for complex operations

**Props:**
- `selectedFiles`: Array of selected file objects
- `onClearSelection`: Callback to clear selection
- `onBulkDelete`: Callback for bulk delete operation
- `onBulkMove`: Callback for bulk move operation
- `onBulkTag`: Callback for bulk tagging
- `onBulkDownload`: Callback for bulk download
- `folders`: Available folders for move operations

### MediaMetadataEditor
A comprehensive metadata editing modal for individual files.

**Features:**
- File information display (size, type, creation date)
- Editable file name
- Alt text editing for images
- Caption/description editing
- Tag management (add/remove tags)
- Custom field support
- Image preview for visual files
- Save/cancel functionality

**Props:**
- `file`: File object to edit
- `isOpen`: Modal visibility state
- `onClose`: Callback to close the modal
- `onSave`: Callback to save metadata changes

### MediaLibraryAdvanced
The main component that integrates all advanced features.

**Features:**
- Grid and list view modes
- Advanced search and filtering
- Sort by name, date, size, or type
- Folder-based organization
- Multi-select functionality
- Integrated bulk operations
- Metadata editing
- Responsive design
- File type filtering
- Date range filtering

**Props:**
- `onFileSelect`: Optional callback for file selection
- `multiSelect`: Enable multi-file selection
- `allowedTypes`: Filter files by MIME types

## Usage Examples

### Basic Media Library
```tsx
import MediaLibraryAdvanced from './components/media/MediaLibraryAdvanced';

function MyComponent() {
  return (
    <MediaLibraryAdvanced
      onFileSelect={(file) => console.log('Selected:', file)}
    />
  );
}
```

### Multi-Select with Type Filtering
```tsx
<MediaLibraryAdvanced
  multiSelect={true}
  allowedTypes={['image/jpeg', 'image/png', 'image/gif']}
  onFileSelect={(file) => handleFileSelection(file)}
/>
```

### Standalone Folder Tree
```tsx
import MediaFolderTree from './components/media/MediaFolderTree';

function FolderSidebar() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  return (
    <MediaFolderTree
      folders={folders}
      selectedFolderId={selectedFolder}
      onFolderSelect={setSelectedFolder}
      onFolderCreate={handleFolderCreate}
      onFolderRename={handleFolderRename}
      onFolderDelete={handleFolderDelete}
    />
  );
}
```

## Data Structures

### MediaFile Interface
```typescript
interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  folderId: string | null;
  tags: string[];
  createdAt: string;
}
```

### MediaFolder Interface
```typescript
interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  children?: MediaFolder[];
  fileCount: number;
}
```

## Styling

All components use Tailwind CSS classes and follow the design system:
- Consistent spacing and typography
- Hover states and transitions
- Responsive breakpoints
- Accessible color contrasts
- Focus indicators for keyboard navigation

## Testing

Comprehensive test coverage includes:
- Component rendering tests
- User interaction tests
- Callback function tests
- Error handling tests
- Accessibility tests

Run tests with:
```bash
npm test -- tests/components/media-advanced.test.tsx
```

## Accessibility

Components follow WCAG guidelines:
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Semantic HTML structure
- ARIA labels and descriptions

## Performance Considerations

- Virtual scrolling for large file lists
- Lazy loading of folder contents
- Debounced search input
- Optimized re-renders with React.memo
- Efficient state management

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Touch-friendly interactions
- Progressive enhancement