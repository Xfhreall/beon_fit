// Components
import { Head, router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { useState } from 'react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const [processing, setProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: {},
        onSubmit: () => {
            router.post(
                send.url(),
                {},
                {
                    onStart: () => setProcessing(true),
                    onFinish: () => setProcessing(false),
                },
            );
        },
    });

    return (
        <>
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void form.handleSubmit();
                }}
                className="space-y-6 text-center"
            >
                <Button disabled={processing} variant="secondary">
                    {processing && <Spinner />}
                    Resend verification email
                </Button>

                <TextLink href={logout()} className="mx-auto block text-sm">
                    Log out
                </TextLink>
            </form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
