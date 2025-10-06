import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: applicationId } = await params

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

        // Get the application data
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

        // Extract KYC documents from kyc_docs array
        const kycDocuments = userData.kyc_docs || []
        
        // Also check for legacy documents stored at root level
        const documentTypes = [
            'id_card_front',
            'id_card_back',
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

        // Build comprehensive document list
        const allDocuments: any[] = []
        
        // Add documents from kyc_docs array
        for (const doc of kycDocuments) {
            allDocuments.push({
                document_type: doc.document_type,
                url: doc.url,
                uploaded_at: doc.uploaded_at,
                updated_at: doc.updated_at,
                verified: doc.verified || false,
                verified_at: doc.verified_at,
                verified_by: doc.verified_by,
                source: 'kyc_docs'
            })
        }
        
        // Check for legacy documents at root level
        for (const docType of documentTypes) {
            // Skip if already in kyc_docs
            if (kycDocuments.some((d: any) => d.document_type === docType)) {
                continue
            }
            
            // Check if document exists at root level
            if (userData[docType]) {
                const verificationInfo = userData.document_verification?.[docType] || {}
                allDocuments.push({
                    document_type: docType,
                    url: userData[docType],
                    uploaded_at: userData.document_uploads?.[docType]?.uploaded_at || null,
                    updated_at: null,
                    verified: verificationInfo.verified || false,
                    verified_at: verificationInfo.verified_at || null,
                    verified_by: null,
                    source: 'legacy'
                })
            }
        }

        // Calculate statistics
        const stats: {
            total_documents: number
            verified_documents: number
            pending_documents: number
            required_documents: string[]
            missing_required: string[]
        } = {
            total_documents: allDocuments.length,
            verified_documents: allDocuments.filter((d: any) => d.verified).length,
            pending_documents: allDocuments.filter((d: any) => !d.verified).length,
            required_documents: [
                'id_card_front',
                'bank_statements_employed',
                'bank_statements_self',
                'employment_letter'
            ],
            missing_required: []
        }

        // Check for missing required documents
        stats.missing_required = stats.required_documents.filter(reqDoc => 
            !allDocuments.some(d => d.document_type === reqDoc)
        )

        return NextResponse.json({
            success: true,
            data: {
                application_id: applicationId,
                documents: allDocuments,
                stats,
                kyc_complete: stats.missing_required.length === 0 && 
                             stats.verified_documents === stats.total_documents
            }
        })

    } catch (error) {
        console.error('Error fetching KYC documents:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        )
    }
}