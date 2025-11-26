import { useState } from 'react';
import UserModeToggle from '../UserModeToggle';

export default function UserModeToggleExample() {
  const [mode, setMode] = useState<"passenger" | "driver">("passenger");

  return (
    <div className="max-w-xs">
      <UserModeToggle
        mode={mode}
        onModeChange={setMode}
      />
      <div className="mt-4 text-sm text-muted-foreground">
        Current mode: <span className="font-semibold capitalize">{mode}</span>
      </div>
    </div>
  );
}