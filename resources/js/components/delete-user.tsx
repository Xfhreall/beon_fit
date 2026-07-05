import { router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    FieldError,
    requiredField,
    useServerErrors,
} from '@/lib/tanstack-form';

type DeleteUserFormData = {
    password: string;
};

const deleteUserFormDefaults: DeleteUserFormData = {
    password: '',
};

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const errors = useServerErrors();
    const [processing, setProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: deleteUserFormDefaults,
        onSubmit: ({ value }) => {
            router.post(ProfileController.destroy.form().action, value, {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: () => {
                    passwordInput.current?.focus();
                    form.reset(deleteUserFormDefaults);
                },
                onSuccess: () => form.reset(deleteUserFormDefaults),
            });
        },
    });

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Delete account"
                description="Delete your account and all of its resources"
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">
                        Please proceed with caution, this cannot be undone.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            data-test="delete-user-button"
                        >
                            Delete account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                            Are you sure you want to delete your account?
                        </DialogTitle>
                        <DialogDescription>
                            Once your account is deleted, all of its resources
                            and data will also be permanently deleted. Please
                            enter your password to confirm you would like to
                            permanently delete your account.
                        </DialogDescription>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void form.handleSubmit();
                            }}
                            className="space-y-6"
                        >
                            <form.Field
                                name="password"
                                validators={{
                                    onBlur: requiredField('Password'),
                                    onChange: requiredField('Password'),
                                }}
                            >
                                {(field) => (
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor={field.name}
                                            className="sr-only"
                                        >
                                            Password
                                        </Label>

                                        <PasswordInput
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(event) =>
                                                field.handleChange(
                                                    event.target.value,
                                                )
                                            }
                                            ref={passwordInput}
                                            placeholder="Password"
                                            autoComplete="current-password"
                                        />

                                        <FieldError
                                            errors={field.state.meta.errors}
                                        />
                                        <InputError message={errors.password} />
                                    </div>
                                )}
                            </form.Field>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() =>
                                            form.reset(deleteUserFormDefaults)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>

                                <form.Subscribe
                                    selector={(state) => ({
                                        canSubmit: state.canSubmit,
                                        isSubmitting: state.isSubmitting,
                                    })}
                                >
                                    {({ canSubmit, isSubmitting }) => (
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={
                                                !canSubmit ||
                                                isSubmitting ||
                                                processing
                                            }
                                            data-test="confirm-delete-user-button"
                                        >
                                            Delete account
                                        </Button>
                                    )}
                                </form.Subscribe>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
