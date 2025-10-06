import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: applicationId } = await params
        const body = await request.json()
        const { documentType, isVerified, status, current_stage } = body

        if (!applicationId || !documentType) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Application ID and document type are required'
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

        // Update document verification status in user_data
        if (!userData.document_verification) {
            userData.document_verification = {}
        }
        
        userData.document_verification[documentType] = {
            verified: isVerified,
            verified_at: isVerified ? new Date().toISOString() : null,
            status: isVerified ? 'verified' : 'pending'
        }

        // Also update in kyc_docs array if it exists
        if (userData.kyc_docs && Array.isArray(userData.kyc_docs)) {
            const docIndex = userData.kyc_docs.findIndex(
                (doc: any) => doc.document_type === documentType
            )
            
            if (docIndex >= 0) {
                userData.kyc_docs[docIndex] = {
                    ...userData.kyc_docs[docIndex],
                    verified: isVerified,
                    verified_at: isVerified ? new Date().toISOString() : null,
                    verified_by: isVerified ? 'admin' : null,
                    updated_at: new Date().toISOString()
                }
            }
        }

        // Prepare update payload
        const updatePayload: any = {
            user_data: JSON.stringify(userData),
            updated_at: new Date().toISOString()
        }

        // If verifying, update the status and current_stage
        if (isVerified) {
            updatePayload.current_stage = 'verified'
            
            // Check if all required documents are verified
            const requiredDocs = ['id_card_front', 'bank_statements', 'employment_letter']
            const allVerified = requiredDocs.every(doc => 
                userData.document_verification?.[doc]?.verified || doc === documentType
            )
            
            if (allVerified && application.status === 'pending') {
                updatePayload.status = 'verified'
            }
        }

        // Update the application
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
                body: JSON.stringify(updatePayload)
            }
        )

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text()
            throw new Error(`Failed to update application: ${errorText}`)
        }

        const updatedData = await updateResponse.json()

        return NextResponse.json({
            success: true,
            message: `Document ${isVerified ? 'verified' : 'unverified'} successfully`,
            data: {
                applicationId,
                documentType,
                isVerified,
                current_stage: updatePayload.current_stage,
                application: updatedData[0]
            }
        })

    } catch (error) {
        console.error('Error verifying document:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        )
    }
}