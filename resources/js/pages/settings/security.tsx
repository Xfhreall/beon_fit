import { Head, router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    FieldError,
    requiredField,
    useServerErrors,
} from '@/lib/tanstack-form';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
};

type SecurityFormData = {
    current_password: string;
    password: string;
    password_confirmation: string;
};

const securityFormDefaults: SecurityFormData = {
    current_password: '',
    password: '',
    password_confirmation: '',
};

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const errors = useServerErrors();
    const [processing, setProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: securityFormDefaults,
        onSubmit: ({ value }) => {
            router.post(SecurityController.update.form().action, value, {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: (serverErrors) => {
                    if (serverErrors.password) {
                        passwordInput.current?.focus();
                    }

                    if (serverErrors.current_password) {
                        currentPasswordInput.current?.focus();
                    }

                    form.reset(securityFormDefaults);
                },
                onSuccess: () => form.reset(securityFormDefaults),
            });
        },
    });

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    <form.Field
                        name="current_password"
                        validators={{
                            onBlur: requiredField('Current password'),
                            onChange: requiredField('Current password'),
                        }}
                    >
                        {(field) => (
                            <div className="grid gap-2">
                                <Label htmlFor={field.name}>
                                    Current password
                                </Label>

                                <PasswordInput
                                    id={field.name}
                                    ref={currentPasswordInput}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) =>
                                        field.handleChange(event.target.value)
                                    }
                                    className="mt-1 block w-full"
                                    autoComplete="current-password"
                                    placeholder="Current password"
                                />

                                <FieldError
                                    errors={field.state.meta.errors}
                                />
                                <InputError
                                    message={errors.current_password}
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="password"
                        validators={{
                            onBlur: requiredField('New password'),
                            onChange: requiredField('New password'),
                        }}
                    >
                        {(field) => (
                            <div className="grid gap-2">
                                <Label htmlFor={field.name}>New password</Label>

                                <PasswordInput
                                    id={field.name}
                                    ref={passwordInput}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) =>
                                        field.handleChange(event.target.value)
                                    }
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder="New password"
                                    passwordrules={props.passwordRules}
                                />

                                <FieldError
                                    errors={field.state.meta.errors}
                                />
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
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    passwordrules={props.passwordRules}
                                />

                                <FieldError
                                    errors={field.state.meta.errors}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>
                        )}
                    </form.Field>

                    <div className="flex items-center gap-4">
                        <form.Subscribe
                            selector={(state) => ({
                                canSubmit: state.canSubmit,
                                isSubmitting: state.isSubmitting,
                            })}
                        >
                            {({ canSubmit, isSubmitting }) => (
                                <Button
                                    disabled={
                                        !canSubmit ||
                                        isSubmitting ||
                                        processing
                                    }
                                    data-test="update-password-button"
                                >
                                    Save
                                </Button>
                            )}
                        </form.Subscribe>
                    </div>
                </form>
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
