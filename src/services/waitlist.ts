export interface WaitlistResult {
  success: boolean
  message: string
  isAlreadySubscribed?: boolean
}

export async function joinWaitlist(email: string, source: string = 'landing_page'): Promise<WaitlistResult> {
  try {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, source }),
    })

    const data = await response.json()
    return data
  } catch (err) {
    console.error('Waitlist error:', err)
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    }
  }
}
