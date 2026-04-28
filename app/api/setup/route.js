"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
exports.dynamic = 'force-dynamic';
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const admin_1 = require("@/lib/supabase/admin");
const server_2 = require("@/lib/supabase/server");
const bcrypt = __importStar(require("bcryptjs"));
async function POST(req) {
    try {
        const count = await prisma_1.prisma.tenant.count();
        if (count > 0) {
            return server_1.NextResponse.json({ success: false, error: 'النظام مُعدّ مسبقاً. تواصل مع مدير النظام للحصول على حساب.' }, { status: 403 });
        }
        const { storeName, firstName, lastName, email, password, phone } = await req.json();
        if (!storeName || !firstName || !lastName || !email || !password) {
            return server_1.NextResponse.json({ success: false, error: 'يرجى تعبئة جميع الحقول المطلوبة' }, { status: 400 });
        }
        if (password.length < 8) {
            return server_1.NextResponse.json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
        }
        let userId;
        let emailConfirmationRequired = false;
        const adminClient = (0, admin_1.createAdminClient)();
        if (adminClient) {
            const { data, error } = await adminClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });
            if (error) {
                // User already exists in Supabase auth — find their ID and reuse it
                const alreadyExists = error.message.toLowerCase().includes('already') ||
                    error.message.toLowerCase().includes('registered') ||
                    error.status === 422;
                if (alreadyExists) {
                    const { data: list } = await adminClient.auth.admin.listUsers();
                    const existing = list?.users?.find((u) => u.email === email);
                    if (existing) {
                        // Update password in case it changed
                        await adminClient.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
                        userId = existing.id;
                    }
                    else {
                        return server_1.NextResponse.json({ success: false, error: error.message }, { status: 400 });
                    }
                }
                else {
                    return server_1.NextResponse.json({ success: false, error: error.message }, { status: 400 });
                }
            }
            else {
                userId = data.user.id;
            }
        }
        else {
            const supabase = await (0, server_2.createClient)();
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                return server_1.NextResponse.json({ success: false, error: error.message }, { status: 400 });
            }
            if (!data.user) {
                return server_1.NextResponse.json({ success: false, error: 'فشل إنشاء المستخدم' }, { status: 500 });
            }
            userId = data.user.id;
            emailConfirmationRequired = !data.user.confirmed_at;
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const slug = `${storeName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '')
            .substring(0, 40) || 'store'}-${Date.now()}`;
        const tenant = await prisma_1.prisma.tenant.create({
            data: {
                id: userId,
                name: storeName,
                nameAr: storeName,
                slug,
                email,
                phone: phone || null,
                users: {
                    create: {
                        id: userId,
                        email,
                        password: hashedPassword,
                        firstName,
                        lastName,
                        phone: phone || null,
                        role: 'OWNER',
                    },
                },
                branches: {
                    create: { name: storeName, nameAr: storeName, isMain: true },
                },
                invoiceSettings: { create: {} },
            },
            include: { users: true, branches: true },
        });
        const [owner, branch] = [tenant.users[0], tenant.branches[0]];
        await prisma_1.prisma.user.update({ where: { id: owner.id }, data: { branchId: branch.id } });
        await prisma_1.prisma.license.create({
            data: {
                tenantId: tenant.id,
                key: `TRIAL-${Date.now().toString(16).toUpperCase()}`,
                type: 'BASIC',
                status: 'ACTIVE',
                maxDevices: 5,
                maxUsers: 10,
                maxBranches: 3,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        return server_1.NextResponse.json({
            success: true,
            data: {
                emailConfirmationRequired,
                message: emailConfirmationRequired
                    ? 'تم إنشاء الحساب. يرجى تفعيل البريد الإلكتروني قبل تسجيل الدخول.'
                    : 'تم إعداد النظام بنجاح. يمكنك تسجيل الدخول الآن.',
            },
        });
    }
    catch (e) {
        const msg = e?.message || '';
        if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
            return server_1.NextResponse.json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
        }
        return server_1.NextResponse.json({ success: false, error: 'حدث خطأ داخلي' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map