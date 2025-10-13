import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    // Fetch active email configuration
    const response = await fetch(`${backendUrl}/email_configurations?is_active=eq.true&select=*`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const configs = await response.json();
      if (configs.length > 0) {
        const config = configs[0];
        // Return configuration without password for security
        const configWithoutPassword = {
          id: config.id,
          name: config.name,
          smtpHost: config.smtp_host,
          smtpPort: config.smtp_port.toString(),
          username: config.username,
          password: config.password ? '••••••••' : '',
          fromEmail: config.from_email,
          fromName: config.from_name,
          useTLS: config.use_tls
        };
        
        return NextResponse.json({
          success: true,
          config: configWithoutPassword
        });
      } else {
        // No active configuration found
        return NextResponse.json({
          success: true,
          config: null
        });
      }
    } else {
      throw new Error(`Database request failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading email config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load email configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    // Validate required fields
    if (!body.smtpHost || !body.smtpPort || !body.fromEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // First, deactivate all existing configurations
    await fetch(`${backendUrl}/email_configurations`, {
      method: 'PATCH',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_active: false })
    });
    
    // Prepare configuration data
    const configData = {
      name: body.name || 'Default Configuration',
      smtp_host: body.smtpHost,
      smtp_port: parseInt(body.smtpPort),
      username: body.username,
      from_email: body.fromEmail,
      from_name: body.fromName || 'CrediLife',
      use_tls: body.useTLS !== false,
      is_active: true,
      is_default: true
    };
    
    // Only include password if it's provided and not the masked value
    if (body.password && body.password !== '••••••••') {
      configData.password = body.password;
    }
    
    // Check if we're updating existing config
    if (body.id) {
      // Update existing configuration
      const response = await fetch(`${backendUrl}/email_configurations?id=eq.${body.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update configuration: ${response.status}`);
      }
    } else {
      // Create new configuration
      const response = await fetch(`${backendUrl}/email_configurations`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create configuration: ${response.status}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Email configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving email config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save email configuration' },
      { status: 500 }
    );
  }
}

// Export the configuration for use in other modules
export async function getEmailConfig() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1';
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
    
    const response = await fetch(`${backendUrl}/email_configurations?is_active=eq.true&select=*`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const configs = await response.json();
      if (configs.length > 0) {
        const config = configs[0];
        return {
          smtpHost: config.smtp_host,
          smtpPort: config.smtp_port.toString(),
          username: config.username,
          password: config.password,
          fromEmail: config.from_email,
          fromName: config.from_name,
          useTLS: config.use_tls
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching email config:', error);
    return null;
  }
}