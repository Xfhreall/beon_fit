// Components
import { Head, router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    FieldError,
    requiredField,
    useServerErrors,
} from '@/lib/tanstack-form';
import { login } from '@/routes';
import { email } from '@/routes/password';

type ForgotPasswordFormData = {
    email: string;
};

export default function ForgotPassword({ status }: { status?: string }) {
    const errors = useServerErrors();
    const [processing, setProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: { email: '' } as ForgotPasswordFormData,
        onSubmit: ({ value }) => {
            router.post(email.url(), value, {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            });
        },
    });

    return (
        <>
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void form.handleSubmit();
                    }}
                >
                    <form.Field
                        name="email"
                        validators={{
                            onBlur: requiredField('Email address'),
                            onChange: requiredField('Email address'),
                        }}
                    >
                        {(field) => (
                            <div className="grid gap-2">
                                <Label htmlFor={field.name}>
                                    Email address
                                </Label>
                                <Input
                                    id={field.name}
                                    type="email"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) =>
                                        field.handleChange(event.target.value)
                                    }
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                />

                                <FieldError
                                    errors={field.state.meta.errors}
                                />
                                <InputError message={errors.email} />
                            </div>
                        )}
                    </form.Field>

                    <div className="my-6 flex items-center justify-start">
                        <form.Subscribe
                            selector={(state) => ({
                                canSubmit: state.canSubmit,
                                isSubmitting: state.isSubmitting,
                            })}
                        >
                            {({ canSubmit, isSubmitting }) => (
                                <Button
                                    className="w-full"
                                    disabled={
                                        !canSubmit ||
                                        isSubmitting ||
                                        processing
                                    }
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Email password reset link
                                </Button>
                            )}
                        </form.Subscribe>
                    </div>
                </form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Or, return to</span>
                    <TextLink href={login()}>log in</TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link',
};
