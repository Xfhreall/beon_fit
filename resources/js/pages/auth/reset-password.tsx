import { Head, router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    FieldError,
    requiredField,
    useServerErrors,
} from '@/lib/tanstack-form';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

type ResetPasswordFormData = {
    password: string;
    password_confirmation: string;
};

const resetPasswordFormDefaults: ResetPasswordFormData = {
    password: '',
    password_confirmation: '',
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    const errors = useServerErrors();
    const [processing, setProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: resetPasswordFormDefaults,
        onSubmit: ({ value }) => {
            router.post(
                update.url(),
                { ...value, token, email },
                {
                    onStart: () => setProcessing(true),
                    onFinish: () => setProcessing(false),
                    onSuccess: () => form.reset(resetPasswordFormDefaults),
                },
            );
        },
    });

    return (
        <>
            <Head title="Reset password" />

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void form.handleSubmit();
                }}
                className="grid gap-6"
            >
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        className="mt-1 block w-full"
                        readOnly
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <form.Field
                    name="password"
                    validators={{
                        onBlur: requiredField('Password'),
                        onChange: requiredField('Password'),
                    }}
                >
                    {(field) => (
                        <div className="grid gap-2">
                            <Label htmlFor={field.name}>Password</Label>
                            <PasswordInput
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) =>
                                    field.handleChange(event.target.value)
                                }
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Password"
                                passwordrules={passwordRules}
                            />
                            <FieldError errors={field.state.meta.errors} />
                            <InputError message={errors.password} />
                        </div>
                    )}
                </form.Field>

                <form.Field
                    name="password_confirmation"
                    validators={{
                        onBlur: requiredField('Confirm password'),
                        onChange: requiredField('Confirm password'),
                    }}
                >
                    {(field) => (
                        <div className="grid gap-2">
                            <Label htmlFor={field.name}>
                                Confirm password
                            </Label>
                            <PasswordInput
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) =>
                                    field.handleChange(event.target.value)
                                }
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Confirm password"
                                passwordrules={passwordRules}
                            />
                            <FieldError errors={field.state.meta.errors} />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>
                    )}
                </form.Field>

                <form.Subscribe
                    selector={(state) => ({
                        canSubmit: state.canSubmit,
                        isSubmitting: state.isSubmitting,
                    })}
                >
                    {({ canSubmit, isSubmitting }) => (
                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={!canSubmit || isSubmitting || processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            Reset password
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Please enter your new password below',
};
