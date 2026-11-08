import { NextRequest, NextResponse } from 'next/server';
import { getTopScores, saveLeaderboardScore } from '@/lib/db';
import { DifficultyLevel } from '@/game/difficulty';

// Basic in-memory rate limiting map: ip -> last submission timestamp
const rateLimitMap = new Map<string, number>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = (searchParams.get('difficulty') || 'normal') as DifficultyLevel;

    const validDifficulties: DifficultyLevel[] = ['easy', 'normal', 'hard', 'nightmare'];
    const diff = validDifficulties.includes(difficulty) ? difficulty : 'normal';

    const scores = await getTopScores(diff, 10);
    return NextResponse.json({ success: true, difficulty: diff, scores });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to retrieve scores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting: 1 submission per 4 seconds per IP
    const ip = request.headers.get('x-forwarded-for') || 'local-client';
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip) || 0;
    if (now - lastRequest < 4000) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a few seconds.' },
        { status: 429 }
      );
    }
    rateLimitMap.set(ip, now);

    const body = await request.json();
    const { name, score, difficulty, character } = body;

    // Server-side validation:
    // 1. Name validation (2 to 15 alphanumeric characters)
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 15) {
      return NextResponse.json(
        { success: false, error: 'Name must be between 2 and 15 characters' },
        { status: 400 }
      );
    }
    const safeNameRegex = /^[a-zA-Z0-9_\-\s]+$/;
    if (!safeNameRegex.test(trimmedName)) {
      return NextResponse.json(
        { success: false, error: 'Name contains invalid characters' },
        { status: 400 }
      );
    }

    // 2. Score bounds validation
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 1000000) {
      return NextResponse.json(
        { success: false, error: 'Invalid score value' },
        { status: 400 }
      );
    }

    // 3. Difficulty validation
    const validDifficulties: DifficultyLevel[] = ['easy', 'normal', 'hard', 'nightmare'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    // 4. Character validation
    if (!character || typeof character !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid character' },
        { status: 400 }
      );
    }

    const saved = await saveLeaderboardScore({
      name: trimmedName,
      score,
      difficulty,
      character,
    });

    return NextResponse.json({ success: true, entry: saved });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to submit score' }, { status: 500 });
  }
}
