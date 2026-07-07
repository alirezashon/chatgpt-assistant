import { PlusIcon } from '@/content/components/icons/PlusIcon';
import { Button } from '@/content/components/ui/Button';
import { SearchInput } from '@/content/components/ui/SearchInput';

interface FolderToolbarProps {
  readonly onCreateFolder: () => void;
}

export function FolderToolbar({ onCreateFolder }: FolderToolbarProps) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex items-center justify-end px-6 pb-4">
        <Button className="h-9 px-3" onClick={onCreateFolder}>
          <PlusIcon />
          <span>New Folder</span>
        </Button>
      </div>
      <SearchInput placeholder="Search folders" />
    </div>
  );
}
