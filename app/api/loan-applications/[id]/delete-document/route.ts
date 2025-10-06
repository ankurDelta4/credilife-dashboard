import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: applicationId } = await params
        const { searchParams } = new URL(request.url)
        const documentType = searchParams.get('documentType')

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

        // Get the document URL before deletion (for Supabase storage deletion)
        let documentUrl = null
        
        // Check in kyc_docs array
        if (userData.kyc_docs && Array.isArray(userData.kyc_docs)) {
            const docIndex = userData.kyc_docs.findIndex(
                (doc: any) => doc.document_type === documentType
            )
            
            if (docIndex >= 0) {
                documentUrl = userData.kyc_docs[docIndex].url
                // Remove from kyc_docs array
                userData.kyc_docs.splice(docIndex, 1)
            }
        }
        
        // Also check and remove from root level (backward compatibility)
        if (userData[documentType]) {
            documentUrl = documentUrl || userData[documentType]
            delete userData[documentType]
        }
        
        // Remove from document_verification if exists
        if (userData.document_verification && userData.document_verification[documentType]) {
            delete userData.document_verification[documentType]
        }
        
        // Remove from document_uploads if exists
        if (userData.document_uploads && userData.document_uploads[documentType]) {
            delete userData.document_uploads[documentType]
        }

        // Delete from Supabase storage if URL exists
        if (documentUrl) {
            try {
                // Extract file path from URL
                const supabaseUrl = 'https://axjfqvdhphkugutkovam.supabase.co'
                const storagePath = documentUrl.replace(
                    `${supabaseUrl}/storage/v1/object/public/credilife-bucket/`,
                    ''
                )
                
                // Delete from Supabase storage
                const deleteStorageResponse = await fetch(
                    `${supabaseUrl}/storage/v1/object/credilife-bucket/${storagePath}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                        },
                    }
                )
                
                if (!deleteStorageResponse.ok) {
                    console.error('Failed to delete from Supabase storage:', await deleteStorageResponse.text())
                    // Continue even if storage deletion fails
                }
            } catch (storageError) {
                console.error('Error deleting from storage:', storageError)
                // Continue even if storage deletion fails
            }
        }

        // Update the application with modified user_data
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
            message: 'Document deleted successfully',
            data: {
                applicationId,
                documentType,
                deletedUrl: documentUrl,
                application: updatedData[0]
            }
        })

    } catch (error) {
        console.error('Error deleting document:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        )
    }
}