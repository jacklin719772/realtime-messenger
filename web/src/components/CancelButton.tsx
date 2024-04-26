import React from "react";

export default function CancelButton({
  setOpen,
}: {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <button
      type="button"
      className="border-2 th-border-for th-color-for w-full inline-flex justify-center py-2 px-4 text-base font-bold rounded focus:outline-none focus:ring-0 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
      onClick={() => setOpen(false)}
    >
      Cancel
    </button>
  );
}
