import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        // 1. Basic validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Please enter both email and password' },
                { status: 400 }
            )
        }

        const cleanEmail = email.trim()

        // 2. Find user by email (case-insensitive)
        const user = await db.user.findFirst({
            where: {
                email: {
                    equals: cleanEmail,
                    mode: 'insensitive',
                },
            },
            include: {
                dealerProfile: true,
                sellerProfile: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // 3. Verify password with bcrypt (with plain text fallback for legacy records)
        let isMatch = false
        try {
            isMatch = await bcrypt.compare(password, user.password)
        } catch {
            isMatch = false
        }

        // If bcrypt didn't match, check plain text fallback just in case
        if (!isMatch && password === user.password) {
            isMatch = true
        }

        if (!isMatch) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // 4. Return user object without sensitive password hash
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _unused, ...userWithoutPassword } = user

        return NextResponse.json(
            {
                message: 'Logged in successfully',
                user: userWithoutPassword,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
