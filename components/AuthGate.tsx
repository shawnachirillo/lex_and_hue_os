'use client'

import { FormEvent, ReactNode, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

type AuthGateChildren = (args: {
  user: User
  signOut: () => Promise<void>
}) => ReactNode

type AuthGateProps = {
  children: AuthGateChildren
}

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoadingSession(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWorking(true)
    setMessage('')

    const result =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

    if (result.error) {
      setMessage(result.error.message)
    } else if (mode === 'signup' && !result.data.session) {
      setMessage(
        'Account created. Check your email to confirm it, then sign in.',
      )
    }

    setWorking(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loadingSession) {
    return (
      <div className="grid min-h-svh place-items-center bg-[#f3eee4] px-6 text-[#171512]">
        <div className="serif text-center text-2xl sm:text-3xl">
          Opening Strategy OS…
        </div>
      </div>
    )
  }

  if (session?.user) {
    return children({
      user: session.user,
      signOut,
    })
  }

  return (
    <main className="grid min-h-svh bg-[#f3eee4] text-[#171512] lg:grid-cols-[1.15fr_.85fr]">
      <section className="flex min-h-[38svh] flex-col justify-between bg-[#171512] px-6 py-6 text-[#f8f1e6] sm:min-h-[44svh] sm:p-8 md:p-14 lg:min-h-screen">
        <div>
          <div className="serif text-2xl font-semibold sm:text-3xl">
            Lex & Hue
          </div>

          <div className="mt-1 text-xs text-white/50 sm:text-sm">
            Strategy OS · 24-week intensive
          </div>
        </div>

        <div className="max-w-2xl py-10 sm:py-14 lg:py-16">
          <h1 className="serif text-[3.25rem] leading-[.9] sm:text-6xl md:text-8xl">
            Learn. Practice.{' '}
            <em className="text-[#ec5a25]">Earn.</em>
          </h1>

          <p className="mt-6 max-w-lg text-sm leading-6 text-white/60 sm:mt-8 sm:text-base sm:leading-7">
            Your graduate-level brand strategy curriculum and Lex & Hue revenue
            accelerator, synced across every device you use.
          </p>
        </div>

        <p className="text-[11px] text-white/35 sm:text-xs">
          Your progress is private to your account.
        </p>
      </section>

      <section className="flex items-start justify-center px-6 py-10 sm:items-center sm:p-10 md:p-12">
        <form
          onSubmit={submit}
          className="w-full max-w-md border-t border-black/30 pt-6 sm:pt-7"
        >
          <div>
            <h2 className="serif text-4xl leading-none sm:text-5xl">
              {mode === 'signin'
                ? 'Welcome back.'
                : 'Create your account.'}
            </h2>

            <p className="mt-3 text-sm leading-6 text-black/55">
              Use the same login on every device and your completed work and
              Strategy Notebook will follow you.
            </p>
          </div>

          <label className="mt-7 block text-sm font-semibold sm:mt-8">
            Email
          </label>

          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 min-h-12 w-full border border-black/25 bg-transparent px-4 py-3 text-base outline-none focus:border-black"
          />

          <label className="mt-5 block text-sm font-semibold">
            Password
          </label>

          <input
            required
            minLength={6}
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 min-h-12 w-full border border-black/25 bg-transparent px-4 py-3 text-base outline-none focus:border-black"
          />

          {message && (
            <p className="mt-4 border-l-2 border-[#ec5a25] pl-3 text-sm leading-5">
              {message}
            </p>
          )}

          <button
            disabled={working}
            className="mt-7 min-h-12 w-full bg-[#ec5a25] px-5 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            {working
              ? 'Working…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setMessage('')
            }}
            className="mt-3 min-h-12 w-full px-2 py-3 text-sm underline underline-offset-4 sm:mt-4"
          >
            {mode === 'signin'
              ? 'First time? Create an account'
              : 'Already have an account? Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}