import { Head, router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    FieldError,
    requiredField,
    useServerErrors,
} from '@/lib/tanstack-form';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

type LoginFormData = {
    email: string;
    password: string;
    remember: boolean;
};

const loginFormDefaults: LoginFormData = {
    email: '',
    password: '',
    remember: false,
};

export default function Login({ status, canResetPassword }: Props) {
    const errors = useServerErrors();
    const [processing, setProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: loginFormDefaults,
        onSubmit: ({ value }) => {
            router.post(store.url(), value, {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => form.setFieldValue('password', ''),
            });
        },
    });

    return (
        <>
            <Head title="Log in" />

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void form.handleSubmit();
                }}
                className="flex flex-col gap-6"
            >
                <div className="grid gap-6">
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
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <FieldError
                                    errors={field.state.meta.errors}
                                />
                                <InputError message={errors.email} />
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="password"
                        validators={{
                            onBlur: requiredField('Password'),
                            onChange: requiredField('Password'),
                        }}
                    >
                        {(field) => (
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor={field.name}>Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) =>
                                        field.handleChange(event.target.value)
                                    }
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <FieldError
                                    errors={field.state.meta.errors}
                                />
                                <InputError message={errors.password} />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="remember">
                        {(field) => (
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id={field.name}
                                    checked={field.state.value}
                                    onCheckedChange={(checked) =>
                                        field.handleChange(checked === true)
                                    }
                                    tabIndex={3}
                                />
                                <Label htmlFor={field.name}>Remember me</Label>
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
                                tabIndex={4}
                                disabled={
                                    !canSubmit || isSubmitting || processing
                                }
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        )}
                    </form.Subscribe>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <TextLink href={register()} tabIndex={5}>
                        Sign up
                    </TextLink>
                </div>
            </form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
