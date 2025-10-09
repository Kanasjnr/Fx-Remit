"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export type AssetOption = {
  code: string;
  label: string;
};

export function AssetPicker({
  open,
  title = "Select Asset",
  options,
  onClose,
  onSelect,
}: {
  open: boolean;
  title?: string;
  options: AssetOption[];
  onClose: () => void;
  onSelect: (code: string) => void;
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-4 text-left align-middle shadow-xl">
                <div className="relative mb-2">
                  <Dialog.Title className="text-center text-xl font-semibold text-gray-900">{title}</Dialog.Title>
                  <button
                    onClick={onClose}
                    className="absolute right-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-2 max-h-80 overflow-y-auto">
                  <ul>
                    {options.map((opt, idx) => (
                      <li key={opt.code}>
                        <button
                          onClick={() => {
                            onSelect(opt.code);
                            onClose();
                          }}
                          className="w-full py-4 px-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <div className="text-gray-900 text-lg text-center">{opt.label}</div>
                        </button>
                        {idx < options.length - 1 && (
                          <div className="mx-12 h-px bg-gray-200/70" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}


