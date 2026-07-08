import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Trash2, LogOut, ShieldAlert, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const { isPro, subType, loading: subLoading } = useSubscription();
  const { logout } = useAuth();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.auth.updateMe({ deleted: true });
      toast({ title: "Account deleted" });
      logout();
    } catch (err) {
      toast({ title: "Something went wrong", variant: "destructive" });
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Subscription */}
      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground px-1">Subscription</h2>
        {subLoading ? (
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
        ) : isPro ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Pro {subType === "lifetime" ? "(Lifetime)" : "(Monthly)"}</p>
              <p className="text-xs text-muted-foreground">All features unlocked</p>
            </div>
          </div>
        ) : (
          <Link
            to="/pricing"
            className="block bg-muted/40 border border-dashed border-primary/30 rounded-xl p-4 flex items-center gap-3 hover:bg-muted/60 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Free Plan</p>
              <p className="text-xs text-muted-foreground">Tap to upgrade to Pro</p>
            </div>
            <Crown className="w-4 h-4 text-primary shrink-0" />
          </Link>
        )}
      </section>

      {/* Account section */}
      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground px-1">Account</h2>
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </section>

      {/* Danger zone */}
      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-destructive/80 px-1">Danger Zone</h2>
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-1">
              This action is permanent and cannot be undone. All your recordings will be lost.
            </p>
          </div>
        </div>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove all
                your saved sound recordings from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <h3>About DecibelDash</h3>
<p>Created by Roger</p>
<p>Built on Base44</p>
<p>Version 1.0.0</p>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Yes, delete my account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}