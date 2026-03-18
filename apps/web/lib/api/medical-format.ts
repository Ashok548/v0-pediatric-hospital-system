import { apiClient } from '@/lib/api-client'

interface MedicalFormatResponse {
  formatted: string
}

export async function formatMedicalText(
  text: string,
): Promise<MedicalFormatResponse> {
  return apiClient<MedicalFormatResponse>('/medical-format', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}
