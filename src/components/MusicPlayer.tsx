import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "./ui/table";

import { Button } from "./ui/button";
import { Howl } from "howler";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { useState } from "react";

// import { invoke } from "@tauri-apps/api/tauri";

type FileList = {
  [key: number]: File;
  length: number;
  item: (index: number) => File;
};

export default function MusicPlayer() {
  const [file, setFile] = useState<Howl>(
    new Howl({ src: [], onend: onEndHandler })
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  function onEndHandler() {
    setIsPlaying(false);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Convert FileList to an array of File objects
    const fileList = event.target.files;
    const fileArray = Array.from(fileList as ArrayLike<File>);

    // Set file list
    setFiles(fileArray);
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      file.stop();
    } else {
      file.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (newValue: number[]) => {
    setProgress(newValue[0]);
  };

  const setTheHowlByIndex = (
    files: File[],
    selectedFileIndex: number = -1
  ): Promise<Howl> => {
    return new Promise((resolve, reject) => {
      setFile(new Howl({ src: [] }));
      const currentFile = files[selectedFileIndex] ?? files[0];
      if (!currentFile) {
        reject(new Error("File not found"));
        return;
      }
      if (currentFile) {
        const reader = new FileReader();

        reader.onload = (e) => {
          if (e.target) {
            const arrayBuffer = e.target.result;
            const blobUrl = URL.createObjectURL(
              new Blob([arrayBuffer as BlobPart], { type: currentFile.type })
            );

            // Create a new instance of Howl with the Blob URL
            const newSound = new Howl({
              src: [blobUrl],
              format: [currentFile.type.split("/")[1]], // Set the file format
              onend: onEndHandler
            });

            setFile(newSound);
            resolve(newSound);
          }
        };

        reader.onerror = () => {
          reject(new Error("Error reading file"));
        };

        reader.readAsArrayBuffer(currentFile); // Or readAsDataURL if you prefer
      }
    });
  };

  return (
    <div>
      <div className="w-full max-w-md mx-auto p-6 bg-background rounded-lg shadow-lg">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-primary">Now Playing</h2>
            <p className="text-sm text-muted-foreground">Artist - Song Title</p>
          </div>

          <Slider
            value={[progress]}
            max={100}
            step={1}
            className="w-full"
            onValueChange={handleProgressChange}
          />

          <div className="flex justify-center space-x-4">
            <Button variant="outline" size="icon">
              <SkipBack
                className="h-4 w-4"
                onClick={async () => {
                  if (files && selectedFileIndex - 1 >= 0) {
                    if (isPlaying) {
                      file.stop();
                      setIsPlaying(!isPlaying);
                    }

                    const newFile = await setTheHowlByIndex(Array.from(files), selectedFileIndex - 1);

                    setSelectedFileIndex(selectedFileIndex - 1);

                    newFile.play();
                    setIsPlaying(true);
                  }
                }}
              />
              <span className="sr-only">Previous track</span>
            </Button>

            <Button variant="outline" size="icon" onClick={togglePlayPause}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
            </Button>

            <Button variant="outline" size="icon">
              <SkipForward
                className="h-4 w-4"
                onClick={async () => {
                  if (
                    files &&
                    files.length &&
                    selectedFileIndex + 1 < files.length
                  ) {
                    if (isPlaying) {
                      file.stop();
                      setIsPlaying(false);
                    }

                    const newFile = await setTheHowlByIndex(Array.from(files), selectedFileIndex + 1);

                    setSelectedFileIndex(selectedFileIndex + 1);

                    newFile.play();
                    setIsPlaying(true);
                  }
                }}
              />
              <span className="sr-only">Next track</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto p-6 bg-background rounded-lg shadow-lg mt-3">
        <div className="flex justify-center mt-6">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture" className="w-full text-center">Select Files</Label>
            <Input
              id="picture"
              className="w-full text-center"
              type="file"
              multiple
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                handleChange(event)
              }
            />
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="w-full max-w-md mx-auto p-6 bg-background rounded-lg shadow-lg mt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(files).map((item, idx) => (
                <TableRow key={idx} className="mt-3">
                  <TableCell
                    className={`font-medium w-full cursor-pointer hover:bg-zinc-100 rounded-lg mt-3 ${selectedFileIndex === idx ? "bg-blue-50" : ""}`}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (isPlaying) {
                        file.stop();
                        setIsPlaying(false);
                      }
                      try {
                        setSelectedFileIndex(idx);
                        const newFile = await setTheHowlByIndex([item], 0);
                        newFile.play();
                        setIsPlaying(true);
                      } catch (err) {
                        console.error(err);
                        setSelectedFileIndex(idx);
                        const newFile = await setTheHowlByIndex(
                          [files[idx]],
                          0
                        );
                        newFile.play();
                        setIsPlaying(true);
                      }
                    }}
                  >
                    {item.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{files.length}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
