import { Head, router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    FieldError,
    requiredField,
    useServerErrors,
} from '@/lib/tanstack-form';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

type RegisterFormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

const registerFormDefaults: RegisterFormData = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
};

export default function Register({ passwordRules }: Props) {
    const errors = useServerErrors();
    const [processing, setProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: registerFormDefaults,
        onSubmit: ({ value }) => {
            router.post(store.url(), value, {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    form.setFieldValue('password', '');
                    form.setFieldValue('password_confirmation', '');
                },
            });
        },
    });

    return (
        <>
            <Head title="Register" />
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void form.handleSubmit();
                }}
                className="flex flex-col gap-6"
            >
                <div className="grid gap-6">
                    <form.Field
                        name="name"
                        validators={{
                            onBlur: requiredField('Name'),
                            onChange: requiredField('Name'),
                        }}
                    >
                        {(field) => (
                            <div className="grid gap-2">
                                <Label htmlFor={field.name}>Name</Label>
                                <Input
                                    id={field.name}
                                    type="text"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) =>
                                        field.handleChange(event.target.value)
                                    }
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    placeholder="Full name"
                                />
                                <FieldError
                                    errors={field.state.meta.errors}
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>
                        )}
                    </form.Field>

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
                                    tabIndex={2}
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
                                <Label htmlFor={field.name}>Password</Label>
                                <PasswordInput
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) =>
                                        field.handleChange(event.target.value)
                                    }
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
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
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
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

                    <form.Subscribe
                        selector={(state) => ({
                            canSubmit: state.canSubmit,
                            isSubmitting: state.isSubmitting,
                        })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                disabled={
                                    !canSubmit || isSubmitting || processing
                                }
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        )}
                    </form.Subscribe>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={login()} tabIndex={6}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
