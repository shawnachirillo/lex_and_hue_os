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
      <div className="grid min-h-screen place-items-center bg-[#f3eee4] text-[#171512]">
        <div className="serif text-3xl">Opening Strategy OS…</div>
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
    <main className="grid min-h-screen bg-[#f3eee4] text-[#171512] lg:grid-cols-[1.15fr_.85fr]">
      <section className="flex min-h-[46vh] flex-col justify-between bg-[#171512] p-8 text-[#f8f1e6] md:p-14 lg:min-h-screen">
        <div>
          <div className="serif text-3xl font-semibold">Lex & Hue</div>
          <div className="mt-1 text-sm text-white/50">
            Strategy OS · 24-week intensive
          </div>
        </div>

        <div className="max-w-2xl py-16">
          <h1 className="serif text-6xl leading-[.92] md:text-8xl">
            Learn. Practice.{' '}
            <em className="text-[#ec5a25]">Earn.</em>
          </h1>

          <p className="mt-8 max-w-lg text-base leading-7 text-white/60">
            Your graduate-level brand strategy curriculum and Lex & Hue revenue
            accelerator, synced across every device you use.
          </p>
        </div>

        <p className="text-xs text-white/35">
          Your progress is private to your account.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 md:p-12">
        <form
          onSubmit={submit}
          className="w-full max-w-md border-t border-black/30 pt-7"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="serif text-5xl">
                {mode === 'signin'
                  ? 'Welcome back.'
                  : 'Create your account.'}
              </h2>

              <p className="mt-3 text-sm leading-6 text-black/55">
                Use the same login on every device and your completed work and
                Strategy Notebook will follow you.
              </p>
            </div>
          </div>

          <label className="mt-8 block text-sm font-semibold">
            Email
          </label>

          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full border border-black/25 bg-transparent px-4 py-3 outline-none focus:border-black"
          />

          <label className="mt-5 block text-sm font-semibold">
            Password
          </label>

          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full border border-black/25 bg-transparent px-4 py-3 outline-none focus:border-black"
          />

          {message && (
            <p className="mt-4 border-l-2 border-[#ec5a25] pl-3 text-sm leading-5">
              {message}
            </p>
          )}

          <button
            disabled={working}
            className="mt-7 w-full bg-[#ec5a25] px-5 py-3.5 font-semibold text-white disabled:opacity-50"
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
            className="mt-4 w-full py-2 text-sm underline underline-offset-4"
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