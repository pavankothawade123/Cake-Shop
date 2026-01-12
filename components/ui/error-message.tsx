import { AlertCircle } from 'lucide-react'

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start space-x-3">
      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <p>{message}</p>
    </div>
  )
}
