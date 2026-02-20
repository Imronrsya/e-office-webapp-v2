"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <span className="flex items-center justify-center size-7 rounded-full bg-green-100 text-green-600 shrink-0">
            <CircleCheckIcon className="size-4" />
          </span>
        ),
        info: (
          <span className="flex items-center justify-center size-7 rounded-full bg-blue-100 text-blue-600 shrink-0">
            <InfoIcon className="size-4" />
          </span>
        ),
        warning: (
          <span className="flex items-center justify-center size-7 rounded-full bg-amber-100 text-amber-600 shrink-0">
            <TriangleAlertIcon className="size-4" />
          </span>
        ),
        error: (
          <span className="flex items-center justify-center size-7 rounded-full bg-red-100 text-red-600 shrink-0">
            <OctagonXIcon className="size-4" />
          </span>
        ),
        loading: (
          <span className="flex items-center justify-center size-7 rounded-full bg-gray-100 text-gray-500 shrink-0">
            <Loader2Icon className="size-4 animate-spin" />
          </span>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "!bg-white !border !border-[#E1DFE0] !rounded-xl !shadow-md !text-[#2B2B2B] !px-4 !py-3 !gap-3 flex items-center",
          title: "!text-[#2B2B2B] !font-semibold !text-sm",
          description: "!text-[#6D6D6D] !text-xs !mt-0.5",
          success: "!text-green-600",
          error: "!text-red-600",
          warning: "!text-amber-600",
          info: "!text-blue-600",
          closeButton:
            "!bg-[#E1DFE0] !border-0 !text-[#6D6D6D] hover:!bg-[#d0cdce]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
