"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArtifexLogo } from "@/components/icons/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Download, Copy, Sparkles, Wand2, GalleryVertical, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateImageFromText } from "@/ai/flows/generate-image-from-text";
import { generateVariationsFromReference } from "@/ai/flows/generate-variations-from-reference";
import { enhanceExistingImage } from "@/ai/flows/enhance-existing-image";
import { maintainStyleConsistency } from "@/ai/flows/maintain-style-consistency";

type GenerationMode = "text-to-image" | "variations" | "enhance" | "style-transfer";

const formSchema = z.object({
  prompt: z.string().min(1, "Prompt is required."),
  style: z.string().optional(),
  artist: z.string().optional(),
  aspectRatio: z.string().default("1:1"),
  referenceImage: z.any().optional(),
  enhancementDescription: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ArtifexPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<GenerationMode>("text-to-image");
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "A majestic lion in a vibrant jungle, detailed, 8k",
      style: "realistic",
      artist: "none",
      aspectRatio: "1:1",
    },
  });

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGeneration: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedImages([]);
    
    let fullPrompt = `${data.prompt}, style: ${data.style}`;
    if(data.artist && data.artist !== 'none') {
        fullPrompt += `, in the style of ${data.artist}`;
    }
    fullPrompt += `, aspect ratio: ${data.aspectRatio}`;

    try {
      let result: { variations?: string[]; imageUrl?: string; enhancedImageDataUri?: string; generatedImageDataUri?: string };
      let images: string[] = [];
      let referenceImageUri: string | undefined;

      if (data.referenceImage && data.referenceImage[0]) {
        referenceImageUri = await fileToDataUri(data.referenceImage[0]);
      }

      switch (activeTab) {
        case "text-to-image":
          result = await generateImageFromText({ prompt: fullPrompt });
          if(result.imageUrl) images.push(result.imageUrl);
          break;
        case "variations":
            if (!referenceImageUri) throw new Error("Reference image is required for variations.");
            result = await generateVariationsFromReference({ referenceImage: referenceImageUri, prompt: data.prompt, numberOfVariations: 4 });
            if(result.variations) images = result.variations;
          break;
        case "enhance":
            if (!referenceImageUri) throw new Error("Image to enhance is required.");
            result = await enhanceExistingImage({ existingImageDataUri: referenceImageUri, enhancementDescription: data.enhancementDescription || data.prompt });
            if(result.enhancedImageDataUri) images.push(result.enhancedImageDataUri);
          break;
        case "style-transfer":
            if (!referenceImageUri) throw new Error("Reference image is required for style transfer.");
            result = await maintainStyleConsistency({ referenceImageDataUri: referenceImageUri, promptText: data.prompt });
            if(result.generatedImageDataUri) images.push(result.generatedImageDataUri);
          break;
        default:
          throw new Error("Invalid generation mode");
      }

      setGeneratedImages(images);
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      toast({ title: "Image copied to clipboard!" });
    } catch (error) {
      console.error("Failed to copy image: ", error);
      toast({ variant: "destructive", title: "Failed to copy image" });
    }
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `artifex-generation-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const ControlPanel = () => (
    <Card className="h-full flex flex-col shadow-2xl shadow-primary/5">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Wand2 className="text-primary" />
          Create
        </CardTitle>
        <CardDescription>Configure your image generation settings.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <form onSubmit={form.handleSubmit(handleGeneration)} className="flex flex-col h-full">
          <ScrollArea className="flex-grow pr-4 -mr-4">
            <div className="space-y-6">
              <Tabs defaultValue="text-to-image" onValueChange={(value) => setActiveTab(value as GenerationMode)}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
                  <TabsTrigger value="text-to-image"><Sparkles className="w-4 h-4 mr-2" />Text</TabsTrigger>
                  <TabsTrigger value="variations"><GalleryVertical className="w-4 h-4 mr-2" />Variations</TabsTrigger>
                  <TabsTrigger value="enhance"><ImagePlus className="w-4 h-4 mr-2" />Enhance</TabsTrigger>
                  <TabsTrigger value="style-transfer"><Wand2 className="w-4 h-4 mr-2" />Style</TabsTrigger>
                </TabsList>

                <div className="pt-4 space-y-4">
                    {(activeTab !== 'text-to-image') && (
                        <div>
                            <Label htmlFor="referenceImage">{(
                                {
                                    'variations': 'Base Image',
                                    'enhance': 'Image to Enhance',
                                    'style-transfer': 'Style Reference Image'
                                }
                            )[activeTab]}</Label>
                            <Input id="referenceImage" type="file" {...form.register("referenceImage")} accept="image/*" className="mt-1" />
                        </div>
                    )}
                  
                  <div>
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea id="prompt" {...form.register("prompt")} placeholder="e.g., A futuristic city skyline at sunset, cyberpunk aesthetic" rows={4} className="mt-1" />
                  </div>
                  
                  {activeTab === 'enhance' && (
                    <div>
                      <Label htmlFor="enhancementDescription">Enhancement Description</Label>
                      <Textarea id="enhancementDescription" {...form.register("enhancementDescription")} placeholder="e.g., Increase sharpness, add a cinematic feel, make colors more vibrant" rows={3} className="mt-1" />
                    </div>
                  )}

                  { (activeTab === 'text-to-image') && (
                      <div className="space-y-4">
                        <div>
                          <Label>Artistic Style</Label>
                          <RadioGroup {...form.register("style")} defaultValue="realistic" className="grid grid-cols-2 gap-2 mt-1">
                              {['realistic', 'watercolor', 'filmic', 'anime', 'pixel-art', '3d-model'].map(style => (
                                <div key={style}>
                                    <RadioGroupItem value={style} id={`style-${style}`} className="peer sr-only" />
                                    <Label htmlFor={`style-${style}`} className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary text-sm capitalize">
                                        {style.replace('-', ' ')}
                                    </Label>
                                </div>
                              ))}
                          </RadioGroup>
                        </div>
                      </div>
                  )
                  }
                </div>
              </Tabs>

              <div>
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <Select onValueChange={(value) => form.setValue('aspectRatio', value)} defaultValue="1:1">
                  <SelectTrigger id="aspectRatio" className="w-full mt-1">
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Square (1:1)</SelectItem>
                    <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                    <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                    <SelectItem value="4:3">Landscape (4:3)</SelectItem>
                    <SelectItem value="3:4">Tall (3:4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <div className="mt-auto pt-6">
            <Button type="submit" disabled={isLoading} className="w-full text-lg py-6 font-headline">
              {isLoading ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const CanvasPanel = () => (
    <ScrollArea className="h-full bg-muted/30 rounded-lg p-4 lg:p-8">
      <div className="w-full h-full flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {[...Array(activeTab === 'variations' ? 4 : 1)].map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        ) : generatedImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {generatedImages.map((src, index) => (
              <Card key={index} className="overflow-hidden group">
                <CardContent className="p-0 aspect-square relative">
                  <Image src={src} alt={`Generated image ${index + 1}`} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" onClick={() => downloadImage(src, index)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" onClick={() => copyImage(src)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <div className="inline-block p-6 bg-background rounded-full mb-4 border">
                <Wand2 className="w-12 h-12 text-primary" />
            </div>
            <h3 className="font-headline text-2xl text-foreground">Artifex Canvas</h3>
            <p>Your generated images will appear here.</p>
            <p className="text-xs mt-4">Start by entering a prompt and click "Generate".</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <div className="flex items-center gap-3">
          <ArtifexLogo className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline tracking-tighter">Artifex</h1>
        </div>
        <p className="ml-4 text-sm text-muted-foreground hidden md:block">AI Image Generation Studio</p>
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 lg:p-6">
        <div className="lg:col-span-1 h-full">
          <ControlPanel />
        </div>
        <div className="lg:col-span-2 h-full min-h-[60vh] lg:min-h-0">
          <CanvasPanel />
        </div>
      </main>
      <footer className="px-4 lg:px-6 py-2 text-center text-xs text-muted-foreground border-t">
        <p>
            Artifex AI. Please use responsibly. Generated content may be unpredictable. 
            All rights for generated images are subject to the terms of the underlying AI models.
        </p>
      </footer>
    </div>
  );
}
