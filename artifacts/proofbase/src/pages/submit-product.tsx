import { Nav } from "@/components/nav";
import { useState } from "react";
import {
  useCreateProduct,
  useGetMyFeedbackCount,
  useGeocodeSearch,
  getGetDashboardProductsQueryKey,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Redirect } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  tagline: z.string().min(5, "Tagline must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const FEEDBACK_REQUIRED = 3;

export default function SubmitProduct() {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationResults, setShowLocationResults] = useState(false);

  const { data: feedbackCountData } = useGetMyFeedbackCount({ query: { enabled: isSignedIn === true } as any });
  const { data: geoResults = [], isFetching: geoFetching } = useGeocodeSearch(
    { q: locationQuery },
    { query: { enabled: locationQuery.length >= 3 } as any }
  );

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect to="/sign-in" />;

  const userFeedbackCount = feedbackCountData?.count ?? 0;
  const canList = feedbackCountData?.canListProduct ?? true;
  const feedbackNeeded = Math.max(0, FEEDBACK_REQUIRED - userFeedbackCount);

  const { register, handleSubmit, control, setValue, watch, formState: { errors }, trigger } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", tagline: "", description: "", category: "",
      websiteUrl: "", logoUrl: "", city: "", country: "",
    },
  });

  const selectedCity = watch("city");
  const selectedCountry = watch("country");

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: (product) => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setLocation(`/products/${product.id}`);
      },
    },
  });

  const onSubmit = (data: FormValues) => {
    createProduct.mutate({
      data: {
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        category: data.category,
        websiteUrl: data.websiteUrl || null,
        logoUrl: data.logoUrl || null,
        city: data.city || null,
        country: data.country || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
    });
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await trigger(["name", "tagline"]);
    else if (step === 2) isValid = await trigger(["description"]);
    else if (step === 3) isValid = await trigger(["category", "websiteUrl"]);
    else isValid = true;
    if (isValid) setStep((s) => Math.min(5, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));
  const totalSteps = 5;

  // Feedback economy gate
  if (feedbackCountData && !canList) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
        <Nav />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-md flex flex-col items-center justify-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-5xl mb-5">🔒</div>
            <h1 className="text-xl md:text-2xl font-bold mb-3">Give Before You List</h1>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
              ProofBase is built on reciprocity. Give feedback to at least{" "}
              <strong className="text-foreground">{FEEDBACK_REQUIRED} products</strong> first.
              You've given <strong className="text-primary">{userFeedbackCount}</strong> —
              just <strong className="text-foreground">{feedbackNeeded} more</strong> to unlock.
            </p>
            <div className="w-full bg-muted rounded-full h-2 mb-8">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (userFeedbackCount / FEEDBACK_REQUIRED) * 100)}%` }}
              />
            </div>
            <Button asChild className="bg-primary text-primary-foreground w-full">
              <a href="/explore">Explore & Give Feedback</a>
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0B0B0C]">
      <Nav />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-2xl flex flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">List a Product</h1>
          <span className="text-sm text-muted-foreground">Step {step}/{totalSteps}</span>
        </div>

        <div className="flex gap-1.5 mb-6 md:mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${step > i ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 md:p-8 border border-border rounded-xl bg-card flex-1 flex flex-col gap-5">

          {/* Step 1: Basic Info */}
          <div className={step === 1 ? "block space-y-4" : "hidden"}>
            <h2 className="text-lg md:text-xl font-semibold mb-2">Basic Info</h2>
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input {...register("name")} placeholder="e.g. ProofBase" className="bg-background border-border" />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input {...register("tagline")} placeholder="A quiet, powerful tool for builders." className="bg-background border-border" />
              {errors.tagline && <p className="text-destructive text-sm">{errors.tagline.message}</p>}
            </div>
          </div>

          {/* Step 2: Description */}
          <div className={step === 2 ? "block space-y-4" : "hidden"}>
            <h2 className="text-lg md:text-xl font-semibold mb-2">Description</h2>
            <div className="space-y-2">
              <Label>Product Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Tell us what makes your product special..."
                className="min-h-[180px] md:min-h-[200px] bg-background border-border"
              />
              {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
            </div>
          </div>

          {/* Step 3: Details */}
          <div className={step === 3 ? "block space-y-4" : "hidden"}>
            <h2 className="text-lg md:text-xl font-semibold mb-2">Details</h2>
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Productivity", "Finance", "Design", "Dev Tools", "Health", "Other"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-destructive text-sm">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Website URL <span className="text-muted-foreground">(Optional)</span></Label>
              <Input {...register("websiteUrl")} placeholder="https://example.com" className="bg-background border-border" />
              {errors.websiteUrl && <p className="text-destructive text-sm">{errors.websiteUrl.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Logo URL <span className="text-muted-foreground">(Optional)</span></Label>
              <Input {...register("logoUrl")} placeholder="https://example.com/logo.png" className="bg-background border-border" />
            </div>
          </div>

          {/* Step 4: Location */}
          <div className={step === 4 ? "block space-y-4" : "hidden"}>
            <h2 className="text-lg md:text-xl font-semibold mb-2">
              Location <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Adding a location puts your product on the global startup map.
            </p>
            <div className="space-y-2 relative">
              <Label>Search City or Country</Label>
              <Input
                value={locationQuery}
                onChange={(e) => { setLocationQuery(e.target.value); setShowLocationResults(true); }}
                placeholder="e.g. San Francisco, London…"
                className="bg-background border-border"
              />
              {showLocationResults && locationQuery.length >= 3 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-card border border-border rounded-xl mt-1 overflow-hidden shadow-xl">
                  {geoFetching ? (
                    <div className="p-3 text-sm text-muted-foreground">Searching…</div>
                  ) : (geoResults as any[]).length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">No results found.</div>
                  ) : (
                    (geoResults as any[]).map((r: any, i: number) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left p-3 text-sm hover:bg-white/5 transition-colors border-b border-border last:border-0"
                        onClick={() => {
                          setValue("city", r.city ?? r.displayName.split(",")[0]);
                          setValue("country", r.country);
                          setValue("latitude", r.latitude);
                          setValue("longitude", r.longitude);
                          setLocationQuery(r.displayName);
                          setShowLocationResults(false);
                        }}
                      >
                        <div className="font-medium">{r.city || r.displayName.split(",")[0]}</div>
                        <div className="text-muted-foreground text-xs truncate">{r.displayName}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedCity && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                <span>📍</span>
                <span className="text-foreground truncate">{selectedCity}{selectedCountry ? `, ${selectedCountry}` : ""}</span>
                <button
                  type="button"
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => { setValue("city", ""); setValue("country", ""); setValue("latitude", undefined); setValue("longitude", undefined); setLocationQuery(""); }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Step 5: Review */}
          <div className={step === 5 ? "block space-y-4" : "hidden"}>
            <h2 className="text-lg md:text-xl font-semibold mb-2">Review & Submit</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Please review your details before submitting.</p>
              <p>Once submitted, your product will be live and ready to collect feedback.</p>
            </div>
            {createProduct.error && (
              <p className="text-destructive text-sm">
                {(createProduct.error as any)?.message ?? "Something went wrong."}
              </p>
            )}
          </div>

          <div className="mt-auto pt-5 flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1 || createProduct.isPending} className="flex-1 sm:flex-none">
              Back
            </Button>
            {step < totalSteps ? (
              <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={createProduct.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none">
                {createProduct.isPending ? "Submitting…" : "Submit Product"}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
