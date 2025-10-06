import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: applicationId } = await params
        const body = await request.json()
        const { documentType, documentUrl } = body

        if (!applicationId || !documentType || !documentUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Application ID, document type, and document URL are required'
                },
                { status: 400 }
            )
        }

        const backendUrl = process.env.BACKEND_URL || 'https://axjfqvdhphkugutkovam.supabase.co/rest/v1'
        const apiKey = process.env.API_KEY || ''

        // First, get the current application data
        const getResponse = await fetch(
            `${backendUrl}/loan_applications?id=eq.${applicationId}&select=*`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        )

        if (!getResponse.ok) {
            throw new Error('Failed to fetch application data')
        }

        const applications = await getResponse.json()
        if (!applications || applications.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Application not found'
                },
                { status: 404 }
            )
        }

        const application = applications[0]
        let userData: any = {}
        
        // Parse existing user_data
        if (application.user_data) {
            try {
                userData = JSON.parse(application.user_data)
            } catch (e) {
                userData = {}
            }
        }

        // Initialize kyc_docs array if it doesn't exist
        if (!userData.kyc_docs) {
            userData.kyc_docs = []
        }

        // Check if document already exists in kyc_docs array
        const existingDocIndex = userData.kyc_docs.findIndex(
            (doc: any) => doc.document_type === documentType
        )

        const newDocument = {
            document_type: documentType,
            url: documentUrl,
            uploaded_at: new Date().toISOString(),
            verified: false,
            verified_at: null
        }

        if (existingDocIndex >= 0) {
            // Update existing document
            userData.kyc_docs[existingDocIndex] = {
                ...userData.kyc_docs[existingDocIndex],
                ...newDocument,
                updated_at: new Date().toISOString()
            }
        } else {
            // Add new document
            userData.kyc_docs.push(newDocument)
        }

        // Also keep backward compatibility - store in root level
        userData[documentType] = documentUrl

        // Update the application with new user_data
        const updateResponse = await fetch(
            `${backendUrl}/loan_applications?id=eq.${applicationId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_data: JSON.stringify(userData),
                    updated_at: new Date().toISOString()
                })
            }
        )

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text()
            throw new Error(`Failed to update application: ${errorText}`)
        }

        const updatedData = await updateResponse.json()

        return NextResponse.json({
            success: true,
            message: 'Document updated successfully',
            data: {
                applicationId,
                documentType,
                documentUrl,
                application: updatedData[0]
            }
        })

    } catch (error) {
        console.error('Error updating document:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        )
    }
}