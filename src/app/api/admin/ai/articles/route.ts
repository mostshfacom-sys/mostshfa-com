import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';

const isAdminUser = (role?: string | null) => role === 'admin' || role === 'super_admin';
const unauthorizedResponse = () => NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

const pickGeminiKey = () => {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY_2 ||
    process.env.GEMINI_API_KEY_3 ||
    ''
  ).trim();
};

type AiMode = 'generate' | 'rewrite';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!isAdminUser(user?.role)) {
    return unauthorizedResponse();
  }

  const apiKey = pickGeminiKey();
  if (!apiKey) {
    return NextResponse.json({ error: 'خدمة الذكاء الاصطناعي غير مفعلة' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const mode = body?.mode as AiMode;

    if (mode !== 'generate' && mode !== 'rewrite') {
      return NextResponse.json({ error: 'وضع غير صالح' }, { status: 400 });
    }

    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const text = typeof body?.text === 'string' ? body.text.trim() : '';

    if (mode === 'generate' && !prompt) {
      return NextResponse.json({ error: 'اكتب وصفًا للمقال' }, { status: 400 });
    }

    if (mode === 'rewrite' && !text) {
      return NextResponse.json({ error: 'أدخل نصًا لإعادة الصياغة' }, { status: 400 });
    }

    const instruction =
      mode === 'generate'
        ? `اكتب مقالة عربية طبية مفيدة وفقًا للطلب التالي. أخرج الناتج بصيغة HTML فقط (بدون Markdown). استخدم <h2> و <h3> و <p> و <ul><li> عند الحاجة. لا تضع أي نص خارج HTML. الطلب: ${prompt}`
        : `أعد صياغة النص التالي بالعربية بأسلوب واضح ومحترف مع الحفاظ على المعنى. أخرج الناتج بصيغة HTML فقط (بدون Markdown). استخدم <p> و <h2>/<h3> إن لزم. لا تضع أي نص خارج HTML. النص: ${text}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: instruction }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    const raw = await geminiRes.text();
    if (!geminiRes.ok) {
      return NextResponse.json({ error: 'فشل في الاتصال بخدمة الذكاء الاصطناعي', details: raw }, { status: 502 });
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'استجابة غير صالحة من الذكاء الاصطناعي' }, { status: 502 });
    }

    const html =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
        .join('')
        .trim() || '';

    if (!html) {
      return NextResponse.json({ error: 'لم يتم توليد محتوى' }, { status: 502 });
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error('AI articles error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
