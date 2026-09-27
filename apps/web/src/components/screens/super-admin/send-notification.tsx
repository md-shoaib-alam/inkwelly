"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send,
  BellRing,
  Info,
  Smartphone,
  Link2,
  Wifi,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { graphqlMutate } from "@/lib/graphql/core";

export function SendNotificationScreen() {
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!token || !title || !body) {
      toast.error("Please fill in Token, Title, and Message");
      return;
    }

    setSending(true);
    try {
      const mutation = `
        mutation SendDirectPush($token: String!, $title: String!, $body: String!, $link: String, $imageUrl: String) {
          sendDirectPush(token: $token, title: $title, body: $body, link: $link, imageUrl: $imageUrl) {
            success
            message
          }
        }
      `;

      const result = await graphqlMutate<{ sendDirectPush: { success: boolean; message: string } }>(
        mutation,
        {
          token,
          title,
          body,
          link: link || undefined,
          imageUrl: imageUrl || undefined,
        }
      );

      if (result.sendDirectPush.success) {
        toast.success(result.sendDirectPush.message || "Push notification sent successfully!");
        setTitle("");
        setBody("");
        setLink("");
        setImageUrl("");
      } else {
        toast.error(result.sendDirectPush.message || "Failed to send push notification");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while sending notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <BellRing className="size-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">FCM Test Bench</h2>
          <p className="text-muted-foreground mt-1">Send test push notifications to a specific device registration token.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Compose Direct Push Message</CardTitle>
            <CardDescription>Send an ephemeral push alert to a single device token via Next.js route handler.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token" className="flex items-center gap-1.5">
                <Smartphone className="size-4 text-indigo-500" />
                FCM Device Registration Token
              </Label>
              <Input 
                id="token" 
                placeholder="Paste the target device token here..." 
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Platform Alert: System Online" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link" className="flex items-center gap-1.5">
                  <Link2 className="size-4 text-indigo-500" />
                  Target Redirect URL (Optional)
                </Label>
                <Input 
                  id="link" 
                  placeholder="e.g. https://localhost:3000/dashboard" 
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="flex items-center gap-1.5">
                <ImageIcon className="size-4 text-indigo-500" />
                Notification Image URL (Optional)
              </Label>
              <Input 
                id="imageUrl" 
                placeholder="e.g. https://example.com/image.png" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Notification Message Body</Label>
              <Textarea 
                id="body" 
                placeholder="Type the message body here..." 
                className="min-h-[100px]"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setToken(""); setTitle(""); setBody(""); setLink(""); setImageUrl(""); }}>
                Reset
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Test Notification"}
                <Send className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/10 dark:to-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="size-5 text-indigo-600" />
                How to Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                1. Allow notification permission in your browser when prompted.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                2. Open your browser console to retrieve your generated FCM device token.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                3. Paste the token into the form on the left, write your message, and hit send!
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-400">
                  <Wifi className="size-3" />
                  ephemeral flow
                </div>
                <ul className="text-sm text-zinc-500 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>No database record is created.</li>
                  <li>Dispatched directly via Firebase API.</li>
                  <li>Delivered immediately in background and foreground.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
