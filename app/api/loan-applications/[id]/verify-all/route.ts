import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: applicationId } = await params
        const body = await request.json()
        const { verify } = body

        if (!applicationId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Application ID is required'
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

        // Initialize document_verification if it doesn't exist
        if (!userData.document_verification) {
            userData.document_verification = {}
        }

        // List of all possible document types to verify
        const documentTypes = [
            'id_card_front',
            'bank_statements_employed',
            'bank_statements_self',
            'employment_letter',
            'id_card',
            'passport',
            'driving_license',
            'address_proof',
            'other_documents',
            'additional_proof',
            'supporting_documents',
            'miscellaneous_docs'
        ]

        // Count documents that exist and will be verified
        let documentsVerified = 0
        
        // Verify all existing documents
        documentTypes.forEach(docType => {
            // Check if document exists in kyc_docs array or root level
            const kycDoc = userData.kyc_docs?.find((doc: any) => doc.document_type === docType)
            const hasDocument = kycDoc || userData[docType]
            
            if (hasDocument) {
                // Update in document_verification
                userData.document_verification[docType] = {
                    verified: verify,
                    verified_at: verify ? new Date().toISOString() : null,
                    status: verify ? 'verified' : 'pending'
                }
                
                // Update in kyc_docs array if exists
                if (kycDoc) {
                    const docIndex = userData.kyc_docs.findIndex(
                        (doc: any) => doc.document_type === docType
                    )
                    if (docIndex >= 0) {
                        userData.kyc_docs[docIndex] = {
                            ...userData.kyc_docs[docIndex],
                            verified: verify,
                            verified_at: verify ? new Date().toISOString() : null,
                            verified_by: verify ? 'admin' : null,
                            updated_at: new Date().toISOString()
                        }
                    }
                }
                
                documentsVerified++
            }
        })

        // Prepare update payload
        const updatePayload: any = {
            user_data: JSON.stringify(userData),
            updated_at: new Date().toISOString()
        }

        // If verifying all documents, update the status and current_stage
        if (verify && documentsVerified > 0) {
            updatePayload.current_stage = 'verified'
            
            // If application is pending, update to verified
            if (application.status === 'pending') {
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
            message: verify 
                ? `All ${documentsVerified} documents verified successfully` 
                : `All ${documentsVerified} documents unverified successfully`,
            data: {
                applicationId,
                documentsVerified,
                verify,
                current_stage: updatePayload.current_stage,
                status: updatePayload.status,
                application: updatedData[0]
            }
        })

    } catch (error) {
        console.error('Error verifying all documents:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        )
    }
}