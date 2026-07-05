import { Head, Link, router, usePage } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    FieldError,
    requiredField,
    useServerErrors,
} from '@/lib/tanstack-form';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

type ProfileFormData = {
    name: string;
    email: string;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const errors = useServerErrors();
    const [processing, setProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: {
            name: auth.user.name,
            email: auth.user.email,
        } as ProfileFormData,
        onSubmit: ({ value }) => {
            router.post(ProfileController.update.form().action, value, {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            });
        },
    });

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void form.handleSubmit();
                    }}
                    className="space-y-6"
                >
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
                                    className="mt-1 block w-full"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) =>
                                        field.handleChange(event.target.value)
                                    }
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <FieldError
                                    errors={field.state.meta.errors}
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.name}
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
                                    className="mt-1 block w-full"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) =>
                                        field.handleChange(event.target.value)
                                    }
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <FieldError
                                    errors={field.state.meta.errors}
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>
                        )}
                    </form.Field>

                    {mustVerifyEmail && auth.user.email_verified_at === null && (
                        <div>
                            <p className="-mt-4 text-sm text-muted-foreground">
                                Your email address is unverified.{' '}
                                <Link
                                    href={send()}
                                    as="button"
                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                >
                                    Click here to re-send the verification
                                    email.
                                </Link>
                            </p>

                            {status === 'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600">
                                    A new verification link has been sent to
                                    your email address.
                                </div>
                            )}
                        </div>
                    )}

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
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            )}
                        </form.Subscribe>
                    </div>
                </form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
