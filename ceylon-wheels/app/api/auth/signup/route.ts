import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password, role, phone, businessName, businessRegNo, sellerType } = body

        // 1. Basic validation
        if (!email || !password || !role) {
            return NextResponse.json(
                { error: 'Missing required fields (email, password, role)' },
                { status: 400 }
            )
        }

        // 2. Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Check if business registration number is already taken
        if (role === 'BUSINESS_DEALER' && businessRegNo) {
            const existingDealer = await db.dealerProfile.findUnique({
                where: { businessRegNo },
            })

            if (existingDealer) {
                return NextResponse.json(
                    { error: 'A dealer with this business registration number already exists' },
                    { status: 400 }
                )
            }
        }

        // 3. Hash the password securely before saving
        const hashedPassword = await bcrypt.hash(password, 10)

        // 4. Create user and conditional profiles based on role
        const newUser = await db.user.create({
            data: {
                email,
                password: hashedPassword, // Saving the secure hash instead of plain text
                role,
                phone,
                // If the user is a business dealer, create their dealer profile automatically
                dealerProfile: role === 'BUSINESS_DEALER' ? {
                    create: {
                        businessName: businessName || 'My Dealership',
                        businessRegNo: businessRegNo || `REG-${Date.now()}`,
                    }
                } : undefined,
                // If private seller or business dealer who also sells, create a seller profile
                sellerProfile: (role === 'PRIVATE_SELLER' || role === 'BUSINESS_DEALER') ? {
                    create: {
                        sellerType: sellerType || role,
                    }
                } : undefined,
            },
            include: {
                dealerProfile: true,
                sellerProfile: true,
            }
        })

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _unused, ...userWithoutPassword } = newUser

        return NextResponse.json(
            { message: 'User registered successfully', user: userWithoutPassword },
            { status: 201 }
        )
    } catch (error: unknown) {
        console.error('Signup error:', error)
        const err = error as { code?: string; meta?: { target?: string[] } }

        // Handle Prisma unique constraint violations (P2002)
        if (err?.code === 'P2002') {
            const target = Array.isArray(err.meta?.target)
                ? err.meta.target.join(', ')
                : err.meta?.target || 'field'
            return NextResponse.json(
                { error: `A record with this ${target} already exists` },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}