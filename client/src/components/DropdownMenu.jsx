import { useEffect, useRef } from "react";

export default function DropdownMenu({ open, onClose, triggerRef, children, className = "" }) {
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        (!triggerRef?.current || !triggerRef.current.contains(e.target))
      ) {
        onClose();
      }
    }
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className={`ml-12 fixed z-[10010] bg-white shadow-lg border border-gray-300 rounded-[2rem] py-2 animate-dropdown-fade px-1 ${className}`}
      style={{ minWidth: 220 }}
    >
      {children}
    </div>
  );
}



