import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json({
        success: true,
        users: []
      });
    }

    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || '';
    
    // Keep original query case 
    const searchQuery = query.trim();
    
    // First, try exact unique_id match
    console.log('Searching for:', searchQuery);
    
    try {
      // Exact match query
      const exactResponse = await fetch(
        `${backendUrl}/users?unique_id=eq.${searchQuery}&select=*`,
        {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (exactResponse.ok) {
        const exactUsers = await exactResponse.json();
        if (exactUsers && exactUsers.length > 0) {
          console.log('Found exact match:', exactUsers);
          return NextResponse.json({
            success: true,
            users: exactUsers
          });
        }
      }

      // If no exact match, try partial search
      const partialResponse = await fetch(
        `${backendUrl}/users?or=(unique_id.ilike.*${searchQuery}*,name.ilike.*${searchQuery}*,email.ilike.*${searchQuery}*)&limit=${limit}&select=*`,
        {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (partialResponse.ok) {
        const partialUsers = await partialResponse.json();
        console.log('Found partial matches:', partialUsers?.length || 0);
        return NextResponse.json({
          success: true,
          users: partialUsers || []
        });
      }

      // If both fail, return empty
      console.log('No matches found');
      return NextResponse.json({
        success: true,
        users: []
      });

    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({
        success: true,
        users: []
      });
    }

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      success: false,
      error: 'Search failed',
      users: []
    }, { status: 500 });
  }
}