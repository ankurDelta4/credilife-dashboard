import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uniqueId = searchParams.get('id') || 'VJTLJB';
    
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    console.log('Testing search for unique_id:', uniqueId);
    console.log('Backend URL:', backendUrl);
    console.log('API Key exists:', !!apiKey);
    
    // Test 1: Exact match with eq
    const exactUrl = `${backendUrl}/users?unique_id=eq.${uniqueId}`;
    console.log('Test 1 - Exact match URL:', exactUrl);
    
    const exactResponse = await fetch(exactUrl, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Exact match response status:', exactResponse.status);
    const exactData = await exactResponse.json();
    console.log('Exact match data:', exactData);
    
    // Test 2: Case-insensitive search with ilike
    const ilikeUrl = `${backendUrl}/users?unique_id=ilike.${uniqueId}`;
    console.log('Test 2 - ilike URL:', ilikeUrl);
    
    const ilikeResponse = await fetch(ilikeUrl, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('ilike response status:', ilikeResponse.status);
    const ilikeData = await ilikeResponse.json();
    console.log('ilike data:', ilikeData);
    
    // Test 3: Get all users to see format
    const allUrl = `${backendUrl}/users?limit=5&select=id,unique_id,name`;
    console.log('Test 3 - Sample users URL:', allUrl);
    
    const allResponse = await fetch(allUrl, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('All users response status:', allResponse.status);
    const allData = await allResponse.json();
    console.log('Sample users (first 5):', allData);
    
    return NextResponse.json({
      success: true,
      tests: {
        exactMatch: {
          status: exactResponse.status,
          data: exactData
        },
        ilikeMatch: {
          status: ilikeResponse.status,
          data: ilikeData
        },
        sampleUsers: {
          status: allResponse.status,
          data: allData
        }
      },
      debug: {
        searchedId: uniqueId,
        backendUrl,
        apiKeyExists: !!apiKey
      }
    });
    
  } catch (error) {
    console.error('Test search error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}